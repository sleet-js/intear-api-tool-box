// =========================
// `accounts.search` — HTTP GET /accounts/search. Prefix match, most recently
// active first.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  AccountsSearchParams,
  AccountsSearchResponse,
} from "../../types/account";

export const search_accounts = async (
  http: HttpClient,
  params: AccountsSearchParams,
): Promise<AccountsSearchResponse> =>
  http.get<AccountsSearchResponse>(
    "/accounts/search",
    params as unknown as Record<string, unknown>,
  );
