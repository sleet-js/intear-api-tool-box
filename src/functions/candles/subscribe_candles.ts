// =========================
// `candles.subscribe` — WS subscription. The latest candle is updated each
// block; new candles start with each new window.
// =========================

import type { WsClient, WsSubscriptionHandle } from "../../client/ws_client";
import type {
  CandlesSubscribeParams,
  CandlesSubscribeResponse,
  CandlePush,
} from "../../types/candle";
import { SubscriptionImpl, type Subscription } from "../../helpers/subscribe";

export const subscribe_candles = (
  ws: WsClient,
  params: CandlesSubscribeParams,
): Subscription<CandlePush, CandlesSubscribeResponse> => {
  const sub = new SubscriptionImpl<CandlePush, CandlesSubscribeResponse>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: WsSubscriptionHandle = {
    id: -1,
    method: "candles.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as CandlesSubscribeResponse),
    push: (p) => sub.push(p as CandlePush),
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