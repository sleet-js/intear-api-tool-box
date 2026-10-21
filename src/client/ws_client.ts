// =========================
// `WsClient` — one WebSocket per `IntearApi` instance.
//
// Responsibilities:
//   * open the socket, wait for the server `hello` before allowing requests;
//   * assign each request a monotonic `id`, route replies back to callers;
//   * route `sub` pushes and `sub end` messages to the matching
//     `SubscriptionImpl`;
//   * auto-reconnect with backoff, re-fire any active subscriptions after the
//     new `hello` so the server picks up where it left off.
//
// Limits enforced by this client:
//   * at most 16 in-flight requests (per docs);
//   * at most 100 active subscriptions per connection (per docs).
// =========================

import { reconnect_delay, sleep } from "../helpers/reconnect";
import type {
  HelloMessage,
  Limits,
  ServerError,
  IdleMessage,
} from "../types/common";
import type { SubscriptionUpdateParams } from "../types/token";

export const DEFAULT_WS_URL = "wss://api.intea.rs/ws";

const is_record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
}

export interface WsSubscriptionHandle {
  // Used by SubscriptionImpl to forward pushes and ends.
  set_result(result: unknown): void;
  push(payload: unknown): void;
  end(code: string, message: string): void;
  unsubscribe(): Promise<void>;
  // Used only for tokens.subscribe:
  update?(params: SubscriptionUpdateParams): Promise<unknown>;
  // Original request id (for `update`). Assigned by WsClient.subscribe()
  // before any user callbacks fire.
  id: number | string;
  method: string;
  params: unknown;
  // Returns the id set by WsClient.subscribe(). Used by endpoint wrappers
  // (e.g. tokens.subscribe) that need the id to call `tokens.update` later.
  get_id?(): number | string | null;
}

interface WsClientOptions {
  url?: string;
  websocket_impl?: typeof WebSocket;
  // Resubscribe with the saved original (method, params). Wired by the
  // orchestrator so it can apply the right `resume_from` for token subs.
  on_resubscribe?: (sub: ActiveSub) => void;
}

interface ActiveSub {
  id: number | string;
  method: string;
  params: unknown;
  handle: WsSubscriptionHandle;
}

export class WsClient {
  readonly #url: string;
  readonly #websocket_impl: typeof WebSocket;
  #socket: WebSocket | null = null;
  #hello_promise: Promise<HelloMessage> | null = null;
  #hello_resolve: ((value: HelloMessage) => void) | null = null;
  #hello_reject: ((err: unknown) => void) | null = null;
  #limits: Limits | null = null;

  #next_id = 1;
  #pending = new Map<number | string, PendingRequest>();
  #active_subs = new Map<number | string, ActiveSub>();

  #reconnect_attempt = 0;
  #closed = false;
  #on_resubscribe: ((sub: ActiveSub) => void) | undefined;
  #last_idle: IdleMessage | null = null;

  constructor(opts: WsClientOptions = {}) {
    this.#url = opts.url ?? DEFAULT_WS_URL;
    this.#websocket_impl = opts.websocket_impl ?? globalThis.WebSocket;
    this.#on_resubscribe = opts.on_resubscribe;
  }

  get hello(): Promise<HelloMessage> {
    if (!this.#hello_promise) this.#connect();
    return this.#hello_promise as Promise<HelloMessage>;
  }

  get limits(): Limits | null {
    return this.#limits;
  }

  // The most recent server `idle` heartbeat, or null if none has arrived.
  // Useful for diagnostics ("is the connection actually alive?").
  get last_idle(): IdleMessage | null {
    return this.#last_idle;
  }

  get is_open(): boolean {
    return this.#socket?.readyState === this.#websocket_impl.OPEN;
  }

  // Close for good: no reconnect, and every in-flight request rejects so
  // callers awaiting `request()` don't hang forever.
  close(): void {
    this.#closed = true;
    const err = new Error("WebSocket client closed");
    for (const [, req] of this.#pending) req.reject(err);
    this.#pending.clear();
    for (const [, sub] of this.#active_subs) sub.handle.end("closed", "WebSocket client closed");
    this.#active_subs.clear();
    this.#socket?.close();
    this.#socket = null;
  }

  // Send a one-shot request, returning the `result` payload.
  request<T>(method: string, params?: unknown): Promise<T> {
    return this.hello.then(
      () =>
        new Promise<T>((resolve, reject) => {
          this.#enforce_pending_limit();
          const id = this.#next_id++;
          this.#pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
          const message: Record<string, unknown> = { id, method };
          if (params !== undefined) message["params"] = params;
          this.#send(message);
        }),
    );
  }

  // Create a subscription. Returns a handle the caller uses to drive pushes.
  subscribe(method: string, params: unknown, handle: WsSubscriptionHandle): void {
    void this.hello.then(() => {
      this.#enforce_sub_limit();
      const id = this.#next_id++;
      // Pre-register the handle so the first reply and any early push route
      // back to the right SubscriptionImpl.
      handle.id = id;
      handle.method = method;
      handle.params = params;
      // Let consumers (e.g. TokenSubscriptionImpl.update()) read the id
      // even after the handle has been passed through several layers.
      handle.get_id = (): number | string => id;
      this.#active_subs.set(id, { id, method, params, handle });
      const message: Record<string, unknown> = { id, method, params };
      this.#send(message);
    });
  }

  // `unsubscribe` — tell the server, then drop the local handle.
  async unsubscribe(id: number | string): Promise<void> {
    if (!this.#active_subs.has(id)) return;
    try {
      await this.request("unsubscribe", { sub: id });
    } finally {
      this.#active_subs.delete(id);
    }
  }

  // Used only for `tokens.subscribe`: send `tokens.update`, and route the
  // first reply back as a result of the original subscription's `update()`.
  send_update(
    sub_id: number | string,
    params: SubscriptionUpdateParams,
  ): Promise<unknown> {
    return this.request("tokens.update", { sub: sub_id, ...params });
  }

  // =========================
  // Internal
  // =========================

  #connect(): void {
    if (this.#closed) return;
    if (this.#hello_promise) return;
    const ws = new this.#websocket_impl(this.#url);
    this.#socket = ws;

    const hello_promise = new Promise<HelloMessage>((resolve, reject) => {
      this.#hello_resolve = resolve;
      this.#hello_reject = reject;
    });
    this.#hello_promise = hello_promise;

    ws.addEventListener("open", () => {
      this.#reconnect_attempt = 0;
    });

    ws.addEventListener("error", (event: Event) => {
      if (this.#hello_reject) this.#hello_reject(new Error(`WebSocket error: ${String(event.type)}`));
    });

    ws.addEventListener("close", () => {
      this.#handle_close();
    });

    ws.addEventListener("message", (event) => {
      this.#handle_message(event.data);
    });
  }

  #send(message: Record<string, unknown>): void {
    const ws = this.#socket;
    if (!ws || ws.readyState !== this.#websocket_impl.OPEN) {
      // Queueing is acceptable for subscriptions but not for one-shot
      // requests after reconnect: the orchestrator waits on `hello` before
      // calling `request()`.
      throw new Error("WebSocket is not open");
    }
    ws.send(JSON.stringify(message));
  }

  #enforce_pending_limit(): void {
    const max = this.#limits?.max_pending_requests ?? 16;
    if (this.#pending.size >= max) {
      throw new RangeError(
        `Too many pending requests (${this.#pending.size}). The server caps this at ${max}.`,
      );
    }
  }

  #enforce_sub_limit(): void {
    const max = this.#limits?.max_subscriptions ?? 100;
    if (this.#active_subs.size >= max) {
      throw new RangeError(
        `Too many active subscriptions (${this.#active_subs.size}). The server caps this at ${max}.`,
      );
    }
  }

  #handle_close(): void {
    if (this.#closed) return;
    // Reject all pending requests; subscriptions will be re-fired after the
    // new hello.
    for (const [, req] of this.#pending) req.reject(new Error("WebSocket closed"));
    this.#pending.clear();
    this.#reset_for_reconnect();
    this.#reconnect_attempt += 1;
    void sleep(reconnect_delay(this.#reconnect_attempt)).then(() => this.#reconnect());
  }

  #reset_for_reconnect(): void {
    this.#socket = null;
    this.#hello_promise = null;
    this.#hello_resolve = null;
    this.#hello_reject = null;
    this.#limits = null;
  }

  #reconnect(): void {
    if (this.#closed) return;
    // The old socket is gone, so its ids mean nothing on the new one. Drop
    // them and re-fire each subscription from its saved (method, params)
    // once the new `hello` arrives — unless the host supplied an
    // `on_resubscribe` hook to drive them differently (e.g. adding a
    // `resume_from` cursor).
    const subs = Array.from(this.#active_subs.values());
    this.#active_subs.clear();
    this.#connect();
    void this.hello.then(() => {
      for (const sub of subs) {
        if (this.#on_resubscribe) {
          this.#on_resubscribe(sub);
        } else {
          this.subscribe(sub.method, sub.params, sub.handle);
        }
      }
    });
  }

  #handle_message(raw: unknown): void {
    let parsed: unknown;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : null;
    } catch {
      // Bad message: the server will close us.
      return;
    }
    if (typeof parsed !== "object" || parsed === null) return;

    const msg = parsed as Record<string, unknown>;

    if ("hello" in msg) {
      const hello = msg["hello"] as HelloMessage;
      this.#limits = hello.limits;
      // The very first request that was awaiting the hello resumes now.
      this.#hello_resolve?.(hello);
      return;
    }
    if ("idle" in msg) {
      // The server sends `idle` on a heartbeat interval when nothing else
      // is flowing. We only record the latest one for diagnostics; liveness
      // is the reconnect backoff's job, not a client-side timer.
      this.#last_idle = msg["idle"] as IdleMessage;
      return;
    }
    if ("sub" in msg) {
      this.#handle_push(msg);
      return;
    }
    if ("id" in msg) {
      this.#handle_reply(msg);
      return;
    }
  }

  #handle_push(raw: Record<string, unknown>): void {
    const sub_id = raw["sub"] as number | string;
    const sub = this.#active_subs.get(sub_id);
    if (!sub) return;

    const h = raw["height"] as number;
    const tm = raw["timestamp_millis"] as number;

    if ("end" in raw) {
      const end_val = raw["end"] as ServerError;
      sub.handle.end(end_val.code, end_val.message);
      this.#active_subs.delete(sub_id);
      return;
    }

    // Strip the envelope fields from the payload we hand to the consumer.
    const payload = { ...raw };
    delete payload["sub"];
    delete payload["height"];
    delete payload["timestamp_millis"];
    delete payload["credits_used"];
    sub.handle.push({
      height: h,
      timestamp_millis: tm,
      ...payload,
    });
  }

  #handle_reply(msg: Record<string, unknown>): void {
    const id = msg["id"] as number | string;
    const sub = this.#active_subs.get(id);
    const pending = this.#pending.get(id);

    if ("result" in msg) {
      const result = msg["result"];
      if (sub) {
        sub.handle.set_result(result);
      } else {
        pending?.resolve(result);
        this.#pending.delete(id);
      }
      return;
    }
    const raw_error = msg["error"];
    if (is_record(raw_error) && typeof raw_error["code"] === "string") {
      const code = raw_error["code"];
      const message = String(raw_error["message"] ?? "");
      const api_err = new Error(`${code}: ${message}`) as Error & { code: string };
      api_err.code = code;
      if (sub) {
        sub.handle.end(code, message);
        this.#active_subs.delete(id);
      } else {
        pending?.reject(api_err);
        this.#pending.delete(id);
      }
    }
  }
}
