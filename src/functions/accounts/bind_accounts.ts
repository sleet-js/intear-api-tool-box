// =========================
// `bind_accounts(http, _ws)` — accounts has no WS subscription form (search,
// by-key lookup, and stats are HTTP-only).
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { search_accounts } from "./search_accounts";
import { get_accounts_by_public_key } from "./public_key";
import { get_key_stats } from "./stats";
import type {
  accounts_search_params,
  accounts_search_response,
  accounts_by_public_key_response,
  key_stats_response,
} from "../../types/account";

export interface accounts_endpoints {
  search: (params: accounts_search_params) => Promise<accounts_search_response>;
  by_public_key: (public_key: string) => Promise<accounts_by_public_key_response>;
  key_stats: () => Promise<key_stats_response>;
}

export const bind_accounts = (http: http_client, _ws: ws_client): accounts_endpoints => ({
  search: (params) => search_accounts(http, params),
  by_public_key: (public_key) => get_accounts_by_public_key(http, public_key),
  key_stats: () => get_key_stats(http),
});
