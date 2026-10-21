// =========================
// `candles.subscribe` — WS subscription. The latest candle is updated each
// block; new candles start with each new window.
// =========================

import type { ws_client, ws_subscription_handle } from "../../client/ws_client";
import type {
  candles_subscribe_params,
  candles_subscribe_response,
  candle_push,
} from "../../types/candle";
import { subscription_impl, type subscription } from "../../helpers/subscribe";

export const subscribe_candles = (
  ws: ws_client,
  params: candles_subscribe_params,
): subscription<candle_push, candles_subscribe_response> => {
  const sub = new subscription_impl<candle_push, candles_subscribe_response>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: ws_subscription_handle = {
    id: -1,
    method: "candles.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as candles_subscribe_response),
    push: (p) => sub.push(p as candle_push),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  };

  ws.subscribe("candles.subscribe", params as unknown as Record<string, unknown>, handle);
  return sub;
};
