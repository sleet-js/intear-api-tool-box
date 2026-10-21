// =========================
// `bind_prices(http)` — prices.at is HTTP-only.
// =========================

import type { http_client } from "../../client/http_client";
import { prices_at } from "./at_prices";
import type { prices_at_params, prices_at_response } from "../../types/schema";

export interface prices_endpoints {
  at: (params: prices_at_params) => Promise<prices_at_response>;
}

export const bind_prices = (http: http_client): prices_endpoints => ({
  at: (params) => prices_at(http, params),
});
