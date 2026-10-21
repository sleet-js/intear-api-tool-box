// =========================
// `transfers.query` — HTTP GET /transfers. History page, newest first by
// default. Use `kind: 'transaction'` to fetch transactions; with no kind,
// include `include_transactions: true` to mix transfers and transactions.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  TransferRequestedField,
  TransfersQueryParams,
  TransfersQueryResponse,
} from "../../types/transfer";

export const query_transfers = async <F extends readonly TransferRequestedField[]>(
  http: HttpClient,
  params: TransfersQueryParams<F>,
): Promise<TransfersQueryResponse<F>> => {
  return http.get<TransfersQueryResponse<F>>(
    "/transfers",
    params as unknown as Record<string, unknown>,
  );
};
