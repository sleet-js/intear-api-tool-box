// =========================
// `activity.subscribe` — WS subscription over `history` (initial pages) or
// `after` (resume). Each push's `last` carries the cursor for reconnect.
// =========================

import type { WsClient, WsSubscriptionHandle } from "../../client/ws_client";
import type {
  ActivitySubscribeParams,
  ActivitySubscribeResponse,
  ActivityPush,
} from "../../types/activity";
import { SubscriptionImpl, type Subscription } from "../../helpers/subscribe";

export const subscribe_activity = (
  ws: WsClient,
  params: ActivitySubscribeParams,
): Subscription<ActivityPush, ActivitySubscribeResponse> => {
  const sub = new SubscriptionImpl<ActivityPush, ActivitySubscribeResponse>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: WsSubscriptionHandle = {
    id: -1,
    method: "activity.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as ActivitySubscribeResponse),
    push: (p) => sub.push(p as ActivityPush),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  };

  ws.subscribe("activity.subscribe", params as unknown as Record<string, unknown>, handle);
  return sub;
};