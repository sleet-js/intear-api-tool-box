// =========================
// `Subscription` — the shape every `.subscribe(...)` call returns.
//   * `result` is a Promise that resolves once with the initial snapshot.
//   * the subscription itself is `Symbol.asyncIterator`-compatible: a `for await`
//     loop yields pushes until the server ends the subscription or the caller
//     calls `close()`.
//   * `update(params)` adjusts a `tokens.subscribe` filter in place.
//   * `close()` sends `unsubscribe` and ends iteration.
// `TPush` is the per-push payload (without the {sub,height,timestamp_millis}
// envelope). `TResult` is the snapshot the server sends first.
// =========================

import type { SubscriptionUpdateParams } from "../types/token";

export interface Subscription<TPush, TResult> {
  readonly result: Promise<TResult>;
  [Symbol.asyncIterator](): AsyncIterator<TPush>;
  close(): Promise<void>;
}

export interface TokenSubscription<TPush, TResult> extends Subscription<TPush, TResult> {
  update(params: SubscriptionUpdateParams): Promise<TResult>;
}

export class SubscriptionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "SubscriptionError";
  }
}

// =========================
// Internal — the queue + signal implementation shared by every endpoint.
// The `WsClient` drives this object through the handle an endpoint module
// builds: `set_result` on the initial snapshot, `push` per server push,
// `end` when the server or transport ends the sub. `unsubscribe_fn` is how
// we ask the server to end the sub locally.
// =========================
export interface SubscriptionInternals<TResult> {
  unsubscribe_fn: () => Promise<void>;
}

export class SubscriptionImpl<TPush, TResult> implements Subscription<TPush, TResult> {
  readonly #internals: SubscriptionInternals<TResult>;
  readonly #queue: TPush[] = [];
  readonly #waiters: Array<(value: IteratorResult<TPush, void>) => void> = [];
  #done = false;
  #error: SubscriptionError | null = null;
  #result_resolve!: (value: TResult) => void;
  readonly result: Promise<TResult>;

  constructor(internals: SubscriptionInternals<TResult>) {
    this.#internals = internals;
    let result_resolve!: (value: TResult) => void;
    this.result = new Promise<TResult>((resolve) => {
      result_resolve = resolve;
    });
    this.#result_resolve = result_resolve;
  }

  // Called by the WS client when the initial snapshot arrives.
  set_result(result: TResult): void {
    this.#result_resolve(result);
  }

  // Called by the WS client on every push.
  push(payload: TPush): void {
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
    this.#error = new SubscriptionError(code, message);
    this.#done = true;
    for (const waiter of this.#waiters.splice(0)) {
      waiter({ value: undefined, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<TPush, void> {
    return {
      next: (): Promise<IteratorResult<TPush, void>> => {
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
// Internal — exposes an `update()` method on top of SubscriptionImpl for
// endpoints that allow it (currently only `tokens.subscribe`).
// =========================
export class TokenSubscriptionImpl<TPush, TResult> extends SubscriptionImpl<TPush, TResult> {
  readonly #update_fn: (params: SubscriptionUpdateParams) => Promise<TResult>;

  constructor(
    internals: SubscriptionInternals<TResult> & {
      update_fn: (params: SubscriptionUpdateParams) => Promise<TResult>;
    },
  ) {
    super(internals);
    this.#update_fn = internals.update_fn;
  }

  async update(params: SubscriptionUpdateParams): Promise<TResult> {
    return this.#update_fn(params);
  }
}
