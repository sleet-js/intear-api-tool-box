// =========================
// `bind_traders(http, _ws)` — traders has no WS subscription form.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { get_traders } from "./get_traders";
import type {
  traders_get_params,
  traders_get_response,
} from "../../types/trader";

export interface traders_endpoints {
  get: (params: traders_get_params) => Promise<traders_get_response>;
}

export const bind_traders = (http: http_client, _ws: ws_client): traders_endpoints => ({
  get: (params) => get_traders(http, params),
});
