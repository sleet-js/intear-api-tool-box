// =========================
// `prices.at` — HTTP GET /prices/at. Prices of tokens at a specific
// timestamp (or list of up to 100 queries). Returns `null` for tokens that
// don't exist, `"0"` before the first price (or always for USDt).
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  PricesAtParams,
  PricesAtResponse,
} from "../../types/schema";

export const prices_at = async (
  http: HttpClient,
  params: PricesAtParams,
): Promise<PricesAtResponse> => {
  // Translate to the `at=<token>:<timestamp>` shape that the server expects.
  const at = params.queries
    .map((q) => `${encodeURIComponent(q.token)}:${q.timestamp_millis}`)
    .join(",");
  return http.get<PricesAtResponse>("/prices/at", { at });
};
