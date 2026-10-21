// =========================
// `trades.subscribe` — WS subscription over `history` (initial newest pages)
// or `after_id` (resume from a reconnect). Subsequent pushes carry a block's
// trades, oldest first, in the same columns as the result.
// =========================

import type { ws_client, ws_subscription_handle } from "../../client/ws_client";
import type {
  trade_requested_field,
  trades_subscribe_params,
  trades_subscribe_response,
  trade_push,
} from "../../types/trade";
import { subscription_impl, type subscription } from "../../helpers/subscribe";

export const subscribe_trades = <f extends readonly trade_requested_field[]>(
  ws: ws_client,
  params: trades_subscribe_params<f>,
): subscription<trade_push<f>, trades_subscribe_response<f>> => {
  const sub = new subscription_impl<trade_push<f>, trades_subscribe_response<f>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: ws_subscription_handle = {
    id: -1,
    method: "trades.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as trades_subscribe_response<f>),
    push: (p) => sub.push(p as trade_push<f>),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  };

  ws.subscribe("trades.subscribe", params as unknown as Record<string, unknown>, handle);
  return sub;
};
