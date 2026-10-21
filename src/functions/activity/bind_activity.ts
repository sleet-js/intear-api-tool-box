// =========================
// `bind_activity(http, ws)` — assembles the `activity` endpoint group.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { query_activity } from "./query_activity";
import { subscribe_activity } from "./subscribe_activity";
import type {
  activity_query_params,
  activity_response,
  activity_subscribe_params,
  activity_subscribe_response,
  activity_push,
} from "../../types/activity";
import type { subscription } from "../../helpers/subscribe";

export interface activity_endpoints {
  query: (params: activity_query_params) => Promise<activity_response>;
  subscribe: (
    params: activity_subscribe_params,
  ) => subscription<activity_push, activity_subscribe_response>;
}

export const bind_activity = (http: http_client, ws: ws_client): activity_endpoints => ({
  query: (params) => query_activity(http, params),
  subscribe: (params) => subscribe_activity(ws, params),
});
