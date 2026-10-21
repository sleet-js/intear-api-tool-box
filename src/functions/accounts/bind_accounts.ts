// =========================
// `bind_accounts(http, _ws)` — accounts has no WS subscription form (search,
// by-key lookup, and stats are HTTP-only).
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { search_accounts } from "./search_accounts";
import { get_accounts_by_public_key } from "./public_key";
import { get_key_stats } from "./stats";
import type {
  AccountsSearchParams,
  AccountsSearchResponse,
  AccountsByPublicKeyResponse,
  KeyStatsResponse,
} from "../../types/account";

export interface AccountsEndpoints {
  search: (params: AccountsSearchParams) => Promise<AccountsSearchResponse>;
  by_public_key: (public_key: string) => Promise<AccountsByPublicKeyResponse>;
  key_stats: () => Promise<KeyStatsResponse>;
}

export const bind_accounts = (http: HttpClient, _ws: WsClient): AccountsEndpoints => ({
  search: (params) => search_accounts(http, params),
  by_public_key: (public_key) => get_accounts_by_public_key(http, public_key),
  key_stats: () => get_key_stats(http),
});
