// =========================
// `bind_trades(http, ws)` — assembles the `trades` endpoint group.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { query_trades } from "./query_trades";
import { subscribe_trades } from "./subscribe_trades";
import type {
  TradeRequestedField,
  TradesQueryParams,
  TradesQueryResponse,
  TradesSubscribeParams,
  TradesSubscribeResponse,
  TradePush,
} from "../../types/trade";
import type { Subscription } from "../../helpers/subscribe";

export interface TradesEndpoints {
  query: <F extends readonly TradeRequestedField[]>(
    params: TradesQueryParams<F>,
  ) => Promise<TradesQueryResponse<F>>;
  subscribe: <F extends readonly TradeRequestedField[]>(
    params: TradesSubscribeParams<F>,
  ) => Subscription<TradePush<F>, TradesSubscribeResponse<F>>;
}

export const bind_trades = (http: HttpClient, ws: WsClient): TradesEndpoints => ({
  query: <F extends readonly TradeRequestedField[]>(params: TradesQueryParams<F>) =>
    query_trades(http, params),
  subscribe: <F extends readonly TradeRequestedField[]>(params: TradesSubscribeParams<F>) =>
    subscribe_trades(ws, params),
});
