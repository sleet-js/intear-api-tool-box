// =========================
// `bind_balances(http, ws)` — assembles the `balances` endpoint group.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { get_balances } from "./get_balances";
import { subscribe_balances } from "./subscribe_balances";
import type {
  BalancesGetResponse,
  BalancesGetParams,
  BalancesSubscribeParams,
  BalancePush,
  BalancesSubscribeResponse,
} from "../../types/balance";
import type { TokenRequestedField } from "../../types/token";
import type { Subscription } from "../../helpers/subscribe";

export interface BalancesEndpoints {
  get: <F extends readonly TokenRequestedField[]>(
    params: BalancesGetParams,
  ) => Promise<BalancesGetResponse<F>>;
  subscribe: <F extends readonly TokenRequestedField[]>(
    params: BalancesSubscribeParams,
  ) => Subscription<BalancePush, BalancesSubscribeResponse<F>>;
}

export const bind_balances = (http: HttpClient, ws: WsClient): BalancesEndpoints => ({
  get: <F extends readonly TokenRequestedField[]>(params: BalancesGetParams) =>
    get_balances<F>(http, params),
  subscribe: <F extends readonly TokenRequestedField[]>(params: BalancesSubscribeParams) =>
    subscribe_balances<F>(ws, params),
});
