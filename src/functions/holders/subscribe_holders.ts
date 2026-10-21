// =========================
// `holders.subscribe` — WS subscription for a token's top N holders.
// =========================

import type { ws_client, ws_subscription_handle } from "../../client/ws_client";
import type {
  holders_subscribe_params,
  holders_subscribe_response,
  holders_push,
} from "../../types/holder";
import { subscription_impl, type subscription } from "../../helpers/subscribe";

export const subscribe_holders = (
  ws: ws_client,
  params: holders_subscribe_params,
): subscription<holders_push, holders_subscribe_response> => {
  const sub = new subscription_impl<holders_push, holders_subscribe_response>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: ws_subscription_handle = {
    id: -1,
    method: "holders.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as holders_subscribe_response),
    push: (p) => sub.push(p as holders_push),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  };

  ws.subscribe("holders.subscribe", params as unknown as Record<string, unknown>, handle);
  return sub;
};
