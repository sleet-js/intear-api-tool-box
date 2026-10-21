// =========================
// `trades.query` — HTTP GET /trades. History page, newest first by default.
// Use `cursor` to page backwards; `after_millis` + `order: 'oldest'` to read
// from a time toward the present.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  TradeRequestedField,
  TradesQueryParams,
  TradesQueryResponse,
} from "../../types/trade";

export const query_trades = async <F extends readonly TradeRequestedField[]>(
  http: HttpClient,
  params: TradesQueryParams<F>,
): Promise<TradesQueryResponse<F>> => {
  return http.get<TradesQueryResponse<F>>(
    "/trades",
    params as unknown as Record<string, unknown>,
  );
};
