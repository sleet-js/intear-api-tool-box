// =========================
// `transfers.subscribe` — WS subscription over `history` or `after_id`.
// Same history-then-live contract as `trades.subscribe`.
// =========================

import type { WsClient, WsSubscriptionHandle } from "../../client/ws_client";
import type {
  TransferRequestedField,
  TransfersSubscribeParams,
  TransfersSubscribeResponse,
  TransferPush,
} from "../../types/transfer";
import { SubscriptionImpl, type Subscription } from "../../helpers/subscribe";

export const subscribe_transfers = <F extends readonly TransferRequestedField[]>(
  ws: WsClient,
  params: TransfersSubscribeParams<F>,
): Subscription<TransferPush<F>, TransfersSubscribeResponse<F>> => {
  const sub = new SubscriptionImpl<TransferPush<F>, TransfersSubscribeResponse<F>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: WsSubscriptionHandle = {
    id: -1,
    method: "transfers.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as TransfersSubscribeResponse<F>),
    push: (p) => sub.push(p as TransferPush<F>),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  };

  ws.subscribe("transfers.subscribe", params as unknown as Record<string, unknown>, handle);
  return sub;
};