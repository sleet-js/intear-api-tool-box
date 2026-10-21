// =========================
// `bind_balances(http, ws)` — assembles the `balances` endpoint group.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { get_balances } from "./get_balances";
import { subscribe_balances } from "./subscribe_balances";
import type {
  balances_get_response,
  balances_get_params,
  balances_subscribe_params,
  balance_push,
  balances_subscribe_response,
} from "../../types/balance";
import type { token_requested_field } from "../../types/token";
import type { subscription } from "../../helpers/subscribe";

export interface balances_endpoints {
  get: <f extends readonly token_requested_field[]>(
    params: balances_get_params,
  ) => Promise<balances_get_response<f>>;
  subscribe: <f extends readonly token_requested_field[]>(
    params: balances_subscribe_params,
  ) => subscription<balance_push, balances_subscribe_response<f>>;
}

export const bind_balances = (http: http_client, ws: ws_client): balances_endpoints => ({
  get: <f extends readonly token_requested_field[]>(params: balances_get_params) =>
    get_balances<f>(http, params),
  subscribe: <f extends readonly token_requested_field[]>(params: balances_subscribe_params) =>
    subscribe_balances<f>(ws, params),
});
