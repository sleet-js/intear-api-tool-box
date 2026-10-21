// =========================
// `balances.get` — HTTP GET /balances. Account's token / native / Rhea
// balances, with optional `token_fields` for wallet views.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  balances_get_response,
  balances_get_params,
} from "../../types/balance";
import type { token_requested_field } from "../../types/token";

export const get_balances = async <f extends readonly token_requested_field[]>(
  http: http_client,
  params: balances_get_params,
): Promise<balances_get_response<f>> => {
  return http.get<balances_get_response<f>>(
    "/balances",
    params as unknown as Record<string, unknown>,
  );
};
