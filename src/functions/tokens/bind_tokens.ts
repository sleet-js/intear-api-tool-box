// =========================
// `bind_tokens(http, ws)` — assembles the `tokens` endpoint group on the
// `intear_api` orchestrator. Each public method forwards straight to the
// matching `functions/tokens/*` file. Generics from those files are
// preserved: the response row type is narrowed by the `fields` you pass.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { get_tokens } from "./get_tokens";
import { search_tokens } from "./search_tokens";
import { subscribe_tokens, type token_subscription } from "./subscribe_tokens";
import { update_tokens } from "./update_tokens";
import type {
  token_push,
  tokens_get_params,
  tokens_get_response,
  tokens_search_params,
  tokens_search_response,
  tokens_subscribe_params,
  tokens_subscribe_response,
  tokens_update_response,
  token_requested_field,
  subscription_update_params,
} from "../../types/token";

export interface tokens_endpoints {
  get: <f extends readonly token_requested_field[]>(
    params: tokens_get_params<f>,
  ) => Promise<tokens_get_response<f>>;
  search: <f extends readonly token_requested_field[]>(
    params: tokens_search_params<f>,
  ) => Promise<tokens_search_response<f>>;
  subscribe: <f extends readonly token_requested_field[]>(
    params: tokens_subscribe_params<f>,
  ) => token_subscription<token_push<f>, tokens_subscribe_response<f>>;
  update: <f extends readonly token_requested_field[]>(
    sub: number | string,
    params: subscription_update_params,
  ) => Promise<tokens_update_response<f>>;
}

export const bind_tokens = (http: http_client, ws: ws_client): tokens_endpoints => ({
  get: <f extends readonly token_requested_field[]>(params: tokens_get_params<f>) =>
    get_tokens(http, params),
  search: <f extends readonly token_requested_field[]>(params: tokens_search_params<f>) =>
    search_tokens(http, params),
  subscribe: <f extends readonly token_requested_field[]>(params: tokens_subscribe_params<f>) =>
    subscribe_tokens(ws, params),
  update: <f extends readonly token_requested_field[]>(
    sub: number | string,
    params: subscription_update_params,
  ) => update_tokens<f>(ws, sub, params),
});
