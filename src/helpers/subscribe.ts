// =========================
// `subscription` — the shape every `.subscribe(...)` call returns.
//   * `result` is a Promise that resolves once with the initial snapshot,
//     OR with `subscription_no_snapshot` if the server opened the
//     subscription without sending a snapshot (e.g. `trades.subscribe`
//     with no `history`, or any subscription whose filter matches nothing).
//     Consumers should handle both cases:
//        if (sub.result instanceof subscription_no_snapshot) { stream-only }
//        else { /* use it as t_result */ }
//     Without this, `await sub.result` could hang forever on a quiet
//     stream.
//   * the subscription itself is `Symbol.asyncIterator`-compatible: a `for await`
//     loop yields pushes until the server ends the subscription or the caller
//     calls `close()`.
//   * `update(params)` adjusts a `tokens.subscribe` filter in place.
//   * `close()` sends `unsubscribe` and ends iteration.
// `t_push` is the per-push payload (without the {sub,height,timestamp_millis}
// envelope). `t_result` is the snapshot the server sends first (when it
// sends one).
// =========================

import type { subscription_update_params } from "../types/token";

/**
 * Marker resolved into `subscription.result` when the server opened the
 * subscription without sending an initial snapshot. Check for it with
 * `instanceof subscription_no_snapshot` before reading `.rows` etc.
 */
export class subscription_no_snapshot {
  readonly #tag: true = true;
  name = "subscription_no_snapshot";
}

export const NO_SNAPSHOT = new subscription_no_snapshot();

export interface subscription<t_push, t_result> {
  readonly result: Promise<t_result | subscription_no_snapshot>;
  [Symbol.asyncIterator](): AsyncIterator<t_push>;
  close(): Promise<void>;
}

export interface token_subscription<t_push, t_result> extends subscription<t_push, t_result> {
  update(params: subscription_update_params): Promise<t_result>;
}

export class subscription_error extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "subscription_error";
  }
}

// =========================
// Internal — the queue + signal implementation shared by every endpoint.
// The `ws_client` drives this object through the handle an endpoint module
// builds: `set_result` on the initial snapshot, `push` per server push,
// `end` when the server or transport ends the sub. `unsubscribe_fn` is how
// we ask the server to end the sub locally.
// =========================
export interface subscription_internals<t_result> {
  unsubscribe_fn: () => Promise<void>;
}

export class subscription_impl<t_push, t_result> implements subscription<t_push, t_result> {
  readonly #internals: subscription_internals<t_result>;
  readonly #queue: t_push[] = [];
  readonly #waiters: Array<(value: IteratorResult<t_push, void>) => void> = [];
  #done = false;
  #error: subscription_error | null = null;
  #result_settled = false;
  #result_resolve!: (value: t_result | subscription_no_snapshot) => void;
  readonly result: Promise<t_result | subscription_no_snapshot>;

  constructor(internals: subscription_internals<t_result>) {
    this.#internals = internals;
    let result_resolve!: (value: t_result | subscription_no_snapshot) => void;
    this.result = new Promise<t_result | subscription_no_snapshot>((resolve) => {
      result_resolve = resolve;
    });
    this.#result_resolve = result_resolve;
  }

  // Called by the WS client when the initial snapshot arrives.
  set_result(result: t_result): void {
    if (this.#result_settled) return;
    this.#result_settled = true;
    this.#result_resolve(result);
  }

  // Called by the WS client on every push.
  push(payload: t_push): void {
    // The first push tells us the stream is alive: if no snapshot arrived
    // before it, treat that as "no snapshot was sent" so consumers can
    // tell the difference between "still waiting" and "there will never
    // be one."
    if (!this.#result_settled) {
      this.#result_settled = true;
      this.#result_resolve(NO_SNAPSHOT);
    }
    if (this.#done) return;
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter({ value: payload, done: false });
    } else {
      this.#queue.push(payload);
    }
  }

  // Called when the server or transport ends the subscription.
  end(code: string, message: string): void {
    if (this.#done) return;
    this.#error = new subscription_error(code, message);
    this.#done = true;
    // If the server ended before sending a snapshot, the consumer would
    // otherwise hang on `await sub.result`. Settle it with the same marker.
    if (!this.#result_settled) {
      this.#result_settled = true;
      this.#result_resolve(NO_SNAPSHOT);
    }
    for (const waiter of this.#waiters.splice(0)) {
      waiter({ value: undefined, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<t_push, void> {
    return {
      next: (): Promise<IteratorResult<t_push, void>> => {
        if (this.#error) {
          return Promise.reject(this.#error);
        }
        const queued = this.#queue.shift();
        if (queued !== undefined) {
          return Promise.resolve({ value: queued, done: false });
        }
        if (this.#done) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise((resolve) => this.#waiters.push(resolve));
      },
    };
  }

  async close(): Promise<void> {
    if (this.#done) return;
    await this.#internals.unsubscribe_fn();
  }
}

// =========================
// Internal — exposes an `update()` method on top of subscription_impl for
// endpoints that allow it (currently only `tokens.subscribe`).
// =========================
export class token_subscription_impl<t_push, t_result> extends subscription_impl<t_push, t_result> {
  readonly #update_fn: (params: subscription_update_params) => Promise<t_result>;

  constructor(
    internals: subscription_internals<t_result> & {
      update_fn: (params: subscription_update_params) => Promise<t_result>;
    },
  ) {
    super(internals);
    this.#update_fn = internals.update_fn;
  }

  async update(params: subscription_update_params): Promise<t_result> {
    return this.#update_fn(params);
  }
}
