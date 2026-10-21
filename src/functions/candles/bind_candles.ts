// =========================
// `bind_candles(http, ws)` — assembles the `candles` endpoint group.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { get_candles } from "./get_candles";
import { subscribe_candles } from "./subscribe_candles";
import type {
  CandlesGetParams,
  CandlesResponse,
  CandlesSubscribeParams,
  CandlesSubscribeResponse,
  CandlePush,
} from "../../types/candle";
import type { Subscription } from "../../helpers/subscribe";

export interface CandlesEndpoints {
  get: (params: CandlesGetParams) => Promise<CandlesResponse>;
  subscribe: (
    params: CandlesSubscribeParams,
  ) => Subscription<CandlePush, CandlesSubscribeResponse>;
}

export const bind_candles = (http: HttpClient, ws: WsClient): CandlesEndpoints => ({
  get: (params) => get_candles(http, params),
  subscribe: (params) => subscribe_candles(ws, params),
});
