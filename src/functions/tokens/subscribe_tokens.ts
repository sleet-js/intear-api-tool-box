// =========================
// `tokens.subscribe` — WS subscription with history-then-live updates.
// Returns a `token_subscription<TPush, TResult>` that extends the base
// `subscription` with `update({ add, remove })`. The `result` Promise
// settles once with the initial snapshot; subsequent pushes only carry the
// changed fields.
// =========================

import type { ws_client, ws_subscription_handle } from "../../client/ws_client";
import { assert_min_interval_ms, assert_precision } from "../../types/common";
import type {
  token_requested_field,
  tokens_subscribe_params,
  tokens_subscribe_response,
  token_push,
  subscription_update_params,
} from "../../types/token";
import { token_subscription_impl } from "../../helpers/subscribe";
import type { token_subscription } from "../../helpers/subscribe";

// Re-export so endpoint modules can pull the type from this file.
export type { token_subscription };

export const subscribe_tokens = <f extends readonly token_requested_field[]>(
  ws: ws_client,
  params: tokens_subscribe_params<f>,
): token_subscription<token_push<f>, tokens_subscribe_response<f>> => {
  if (params.precision !== undefined) assert_precision(params.precision);
  if (params.min_interval_ms !== undefined) assert_min_interval_ms(params.min_interval_ms);

  const sub = new token_subscription_impl<token_push<f>, tokens_subscribe_response<f>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null || id === -1) return;
      await ws.unsubscribe(id);
    },
    update_fn: async (u) =>
      (await ws.send_update(handle.id, u)) as tokens_subscribe_response<f>,
  });

  // ws_client writes the real subscription id onto `handle.id` and replaces
  // `get_id` before any user callback fires, so `update()` reads it lazily.
  const handle: ws_subscription_handle = {
    id: -1,
    method: "tokens.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as tokens_subscribe_response<f>),
    push: (p) => sub.push(p as token_push<f>),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null || id === -1) return;
      await ws.unsubscribe(id);
    },
    update: async (u: subscription_update_params) => {
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
