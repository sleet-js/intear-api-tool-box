// =========================
// `bind_prices(http)` — prices.at is HTTP-only.
// =========================

import type { HttpClient } from "../../client/http_client";
import { prices_at } from "./at_prices";
import type { PricesAtParams, PricesAtResponse } from "../../types/schema";

export interface PricesEndpoints {
  at: (params: PricesAtParams) => Promise<PricesAtResponse>;
}

export const bind_prices = (http: HttpClient): PricesEndpoints => ({
  at: (params) => prices_at(http, params),
});
