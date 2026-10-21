// =========================
// `accounts.search` — HTTP GET /accounts/search. Prefix match, most recently
// active first.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  accounts_search_params,
  accounts_search_response,
} from "../../types/account";

export const search_accounts = async (
  http: http_client,
  params: accounts_search_params,
): Promise<accounts_search_response> =>
  http.get<accounts_search_response>(
    "/accounts/search",
    params as unknown as Record<string, unknown>,
  );
