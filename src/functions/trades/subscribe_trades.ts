// =========================
// `trades.subscribe` — WS subscription over `history` (initial newest pages)
// or `after_id` (resume from a reconnect). Subsequent pushes carry a block's
// trades, oldest first, in the same columns as the result.
// =========================

import type { WsClient, WsSubscriptionHandle } from "../../client/ws_client";
import type {
  TradeRequestedField,
  TradesSubscribeParams,
  TradesSubscribeResponse,
  TradePush,
} from "../../types/trade";
import { SubscriptionImpl, type Subscription } from "../../helpers/subscribe";

export const subscribe_trades = <F extends readonly TradeRequestedField[]>(
  ws: WsClient,
  params: TradesSubscribeParams<F>,
): Subscription<TradePush<F>, TradesSubscribeResponse<F>> => {
  const sub = new SubscriptionImpl<TradePush<F>, TradesSubscribeResponse<F>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: WsSubscriptionHandle = {
    id: -1,
    method: "trades.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as TradesSubscribeResponse<F>),
    push: (p) => sub.push(p as TradePush<F>),
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