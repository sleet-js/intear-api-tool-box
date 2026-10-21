// =========================
// `transfers.subscribe` — WS subscription over `history` or `after_id`.
// Same history-then-live contract as `trades.subscribe`.
// =========================

import type { ws_client, ws_subscription_handle } from "../../client/ws_client";
import type {
  transfer_requested_field,
  transfers_subscribe_params,
  transfers_subscribe_response,
  transfer_push,
} from "../../types/transfer";
import { subscription_impl, type subscription } from "../../helpers/subscribe";

export const subscribe_transfers = <f extends readonly transfer_requested_field[]>(
  ws: ws_client,
  params: transfers_subscribe_params<f>,
): subscription<transfer_push<f>, transfers_subscribe_response<f>> => {
  const sub = new subscription_impl<transfer_push<f>, transfers_subscribe_response<f>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: ws_subscription_handle = {
    id: -1,
    method: "transfers.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as transfers_subscribe_response<f>),
    push: (p) => sub.push(p as transfer_push<f>),
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
