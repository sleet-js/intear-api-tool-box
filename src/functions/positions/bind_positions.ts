// =========================
// `bind_positions(http, _ws)` — positions has no WS subscription form.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { get_positions } from "./get_positions";
import type {
  PositionsGetParams,
  PositionsResponse,
} from "../../types/position";

export interface PositionsEndpoints {
  get: (params: PositionsGetParams) => Promise<PositionsResponse>;
}

export const bind_positions = (http: HttpClient, _ws: WsClient): PositionsEndpoints => ({
  get: (params) => get_positions(http, params),
});
