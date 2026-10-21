// =========================
// `trades.query` — HTTP GET /trades. History page, newest first by default.
// Use `cursor` to page backwards; `after_millis` + `order: 'oldest'` to read
// from a time toward the present.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  trade_requested_field,
  trades_query_params,
  trades_query_response,
} from "../../types/trade";

export const query_trades = async <f extends readonly trade_requested_field[]>(
  http: http_client,
  params: trades_query_params<f>,
): Promise<trades_query_response<f>> => {
  return http.get<trades_query_response<f>>(
    "/trades",
    params as unknown as Record<string, unknown>,
  );
};
