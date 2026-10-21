// =========================
// `transfers.query` — HTTP GET /transfers. History page, newest first by
// default. Use `kind: 'transaction'` to fetch transactions; with no kind,
// include `include_transactions: true` to mix transfers and transactions.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  transfer_requested_field,
  transfers_query_params,
  transfers_query_response,
} from "../../types/transfer";

export const query_transfers = async <f extends readonly transfer_requested_field[]>(
  http: http_client,
  params: transfers_query_params<f>,
): Promise<transfers_query_response<f>> => {
  return http.get<transfers_query_response<f>>(
    "/transfers",
    params as unknown as Record<string, unknown>,
  );
};
