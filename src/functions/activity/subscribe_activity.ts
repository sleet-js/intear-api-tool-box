// =========================
// `activity.subscribe` — WS subscription over `history` (initial pages) or
// `after` (resume). Each push's `last` carries the cursor for reconnect.
// =========================

import type { ws_client, ws_subscription_handle } from "../../client/ws_client";
import type {
  activity_subscribe_params,
  activity_subscribe_response,
  activity_push,
} from "../../types/activity";
import { subscription_impl, type subscription } from "../../helpers/subscribe";

export const subscribe_activity = (
  ws: ws_client,
  params: activity_subscribe_params,
): subscription<activity_push, activity_subscribe_response> => {
  const sub = new subscription_impl<activity_push, activity_subscribe_response>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: ws_subscription_handle = {
    id: -1,
    method: "activity.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as activity_subscribe_response),
    push: (p) => sub.push(p as activity_push),
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
