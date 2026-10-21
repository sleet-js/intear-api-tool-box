// =========================
// `bind_tokens(http, ws)` — assembles the `tokens` endpoint group on the
// `IntearApi` orchestrator. Each public method forwards straight to the
// matching `functions/tokens/*` file. Generics from those files are
// preserved: the response row type is narrowed by the `fields` you pass.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { get_tokens } from "./get_tokens";
import { search_tokens } from "./search_tokens";
import { subscribe_tokens, type TokenSubscription } from "./subscribe_tokens";
import { update_tokens } from "./update_tokens";
import type {
  TokenPush,
  TokensGetParams,
  TokensGetResponse,
  TokensSearchParams,
  TokensSearchResponse,
  TokensSubscribeParams,
  TokensSubscribeResponse,
  TokensUpdateResponse,
  TokenRequestedField,
  SubscriptionUpdateParams,
} from "../../types/token";

export interface TokensEndpoints {
  get: <F extends readonly TokenRequestedField[]>(
    params: TokensGetParams<F>,
  ) => Promise<TokensGetResponse<F>>;
  search: <F extends readonly TokenRequestedField[]>(
    params: TokensSearchParams<F>,
  ) => Promise<TokensSearchResponse<F>>;
  subscribe: <F extends readonly TokenRequestedField[]>(
    params: TokensSubscribeParams<F>,
  ) => TokenSubscription<TokenPush<F>, TokensSubscribeResponse<F>>;
  update: <F extends readonly TokenRequestedField[]>(
    sub: number | string,
    params: SubscriptionUpdateParams,
  ) => Promise<TokensUpdateResponse<F>>;
}

export const bind_tokens = (http: HttpClient, ws: WsClient): TokensEndpoints => ({
  get: <F extends readonly TokenRequestedField[]>(params: TokensGetParams<F>) =>
    get_tokens(http, params),
  search: <F extends readonly TokenRequestedField[]>(params: TokensSearchParams<F>) =>
    search_tokens(http, params),
  subscribe: <F extends readonly TokenRequestedField[]>(params: TokensSubscribeParams<F>) =>
    subscribe_tokens(ws, params),
  update: <F extends readonly TokenRequestedField[]>(
    sub: number | string,
    params: SubscriptionUpdateParams,
  ) => update_tokens<F>(ws, sub, params),
});