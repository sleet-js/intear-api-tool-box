// =========================
// `tokens.subscribe` — WS subscription with history-then-live updates.
// Returns a `TokenSubscription<TPush, TResult>` that extends the base
// `Subscription` with `update({ add, remove })`. The `result` Promise
// settles once with the initial snapshot; subsequent pushes only carry the
// changed fields.
// =========================

import type { WsClient, WsSubscriptionHandle } from "../../client/ws_client";
import { assert_min_interval_ms, assert_precision } from "../../types/common";
import type {
  TokenRequestedField,
  TokensSubscribeParams,
  TokensSubscribeResponse,
  TokenPush,
  SubscriptionUpdateParams,
} from "../../types/token";
import { TokenSubscriptionImpl } from "../../helpers/subscribe";
import type { TokenSubscription } from "../../helpers/subscribe";

// Re-export so endpoint modules can pull the type from this file.
export type { TokenSubscription };

export const subscribe_tokens = <F extends readonly TokenRequestedField[]>(
  ws: WsClient,
  params: TokensSubscribeParams<F>,
): TokenSubscription<TokenPush<F>, TokensSubscribeResponse<F>> => {
  if (params.precision !== undefined) assert_precision(params.precision);
  if (params.min_interval_ms !== undefined) assert_min_interval_ms(params.min_interval_ms);

  const sub = new TokenSubscriptionImpl<TokenPush<F>, TokensSubscribeResponse<F>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null || id === -1) return;
      await ws.unsubscribe(id);
    },
    update_fn: async (u) =>
      (await ws.send_update(handle.id, u)) as TokensSubscribeResponse<F>,
  });

  // WsClient writes the real subscription id onto `handle.id` and replaces
  // `get_id` before any user callback fires, so `update()` reads it lazily.
  const handle: WsSubscriptionHandle = {
    id: -1,
    method: "tokens.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as TokensSubscribeResponse<F>),
    push: (p) => sub.push(p as TokenPush<F>),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null || id === -1) return;
      await ws.unsubscribe(id);
    },
    update: async (u: SubscriptionUpdateParams) => {
      const id = handle.get_id?.();
      if (id == null || id === -1) {
        throw new Error("Subscription not established yet");
      }
      return ws.send_update(id, u);
    },
  };

  ws.subscribe("tokens.subscribe", params as unknown as Record<string, unknown>, handle);
  return sub;
};