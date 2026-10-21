// =========================
// `bind_trades(http, ws)` — assembles the `trades` endpoint group.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { query_trades } from "./query_trades";
import { subscribe_trades } from "./subscribe_trades";
import type {
  trade_requested_field,
  trades_query_params,
  trades_query_response,
  trades_subscribe_params,
  trades_subscribe_response,
  trade_push,
} from "../../types/trade";
import type { subscription } from "../../helpers/subscribe";

export interface trades_endpoints {
  query: <f extends readonly trade_requested_field[]>(
    params: trades_query_params<f>,
  ) => Promise<trades_query_response<f>>;
  subscribe: <f extends readonly trade_requested_field[]>(
    params: trades_subscribe_params<f>,
  ) => subscription<trade_push<f>, trades_subscribe_response<f>>;
}

export const bind_trades = (http: http_client, ws: ws_client): trades_endpoints => ({
  query: <f extends readonly trade_requested_field[]>(params: trades_query_params<f>) =>
    query_trades(http, params),
  subscribe: <f extends readonly trade_requested_field[]>(params: trades_subscribe_params<f>) =>
    subscribe_trades(ws, params),
});
