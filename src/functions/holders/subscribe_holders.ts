// =========================
// `holders.subscribe` — WS subscription for a token's top N holders.
// =========================

import type { WsClient, WsSubscriptionHandle } from "../../client/ws_client";
import type {
  HoldersSubscribeParams,
  HoldersSubscribeResponse,
  HoldersPush,
} from "../../types/holder";
import { SubscriptionImpl, type Subscription } from "../../helpers/subscribe";

export const subscribe_holders = (
  ws: WsClient,
  params: HoldersSubscribeParams,
): Subscription<HoldersPush, HoldersSubscribeResponse> => {
  const sub = new SubscriptionImpl<HoldersPush, HoldersSubscribeResponse>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: WsSubscriptionHandle = {
    id: -1,
    method: "holders.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as HoldersSubscribeResponse),
    push: (p) => sub.push(p as HoldersPush),
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