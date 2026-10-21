// =========================
// `bind_holders(http, ws)` — assembles the `holders` endpoint group.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { get_holders } from "./get_holders";
import { subscribe_holders } from "./subscribe_holders";
import type {
  holders_get_params,
  holders_get_response,
  holders_subscribe_params,
  holders_subscribe_response,
  holders_push,
} from "../../types/holder";
import type { subscription } from "../../helpers/subscribe";

export interface holders_endpoints {
  get: (params: holders_get_params) => Promise<holders_get_response>;
  subscribe: (
    params: holders_subscribe_params,
  ) => subscription<holders_push, holders_subscribe_response>;
}

export const bind_holders = (http: http_client, ws: ws_client): holders_endpoints => ({
  get: (params) => get_holders(http, params),
  subscribe: (params) => subscribe_holders(ws, params),
});
