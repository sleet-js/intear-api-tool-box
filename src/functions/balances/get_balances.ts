// =========================
// `balances.get` — HTTP GET /balances. Account's token / native / Rhea
// balances, with optional `token_fields` for wallet views.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  BalancesGetResponse,
  BalancesGetParams,
} from "../../types/balance";
import type { TokenRequestedField } from "../../types/token";

export const get_balances = async <F extends readonly TokenRequestedField[]>(
  http: HttpClient,
  params: BalancesGetParams,
): Promise<BalancesGetResponse<F>> => {
  return http.get<BalancesGetResponse<F>>(
    "/balances",
    params as unknown as Record<string, unknown>,
  );
};
