// =========================
// `bind_candles(http, ws)` — assembles the `candles` endpoint group.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { get_candles } from "./get_candles";
import { subscribe_candles } from "./subscribe_candles";
import type {
  candles_get_params,
  candles_response,
  candles_subscribe_params,
  candles_subscribe_response,
  candle_push,
} from "../../types/candle";
import type { subscription } from "../../helpers/subscribe";

export interface candles_endpoints {
  get: (params: candles_get_params) => Promise<candles_response>;
  subscribe: (
    params: candles_subscribe_params,
  ) => subscription<candle_push, candles_subscribe_response>;
}

export const bind_candles = (http: http_client, ws: ws_client): candles_endpoints => ({
  get: (params) => get_candles(http, params),
  subscribe: (params) => subscribe_candles(ws, params),
});
