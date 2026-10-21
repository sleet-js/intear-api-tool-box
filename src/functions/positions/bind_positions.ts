// =========================
// `bind_positions(http, _ws)` — positions has no WS subscription form.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { get_positions } from "./get_positions";
import type {
  positions_get_params,
  positions_response,
} from "../../types/position";

export interface positions_endpoints {
  get: (params: positions_get_params) => Promise<positions_response>;
}

export const bind_positions = (http: http_client, _ws: ws_client): positions_endpoints => ({
  get: (params) => get_positions(http, params),
});
