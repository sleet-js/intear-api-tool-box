// =========================
// `bind_activity(http, ws)` — assembles the `activity` endpoint group.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { query_activity } from "./query_activity";
import { subscribe_activity } from "./subscribe_activity";
import type {
  ActivityQueryParams,
  ActivityResponse,
  ActivitySubscribeParams,
  ActivitySubscribeResponse,
  ActivityPush,
} from "../../types/activity";
import type { Subscription } from "../../helpers/subscribe";

export interface ActivityEndpoints {
  query: (params: ActivityQueryParams) => Promise<ActivityResponse>;
  subscribe: (
    params: ActivitySubscribeParams,
  ) => Subscription<ActivityPush, ActivitySubscribeResponse>;
}

export const bind_activity = (http: HttpClient, ws: WsClient): ActivityEndpoints => ({
  query: (params) => query_activity(http, params),
  subscribe: (params) => subscribe_activity(ws, params),
});
