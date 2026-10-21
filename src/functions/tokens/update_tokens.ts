// =========================
// `tokens.update` — adjust an existing `tokens.subscribe` in place by
// adding or removing token ids. Used for the "list of tokens on screen"
// pattern.
// =========================

import type { ws_client } from "../../client/ws_client";
import type {
  token_requested_field,
  tokens_update_response,
  subscription_update_params,
} from "../../types/token";

export const update_tokens = async <f extends readonly token_requested_field[]>(
  ws: ws_client,
  sub: number | string,
  params: subscription_update_params,
): Promise<tokens_update_response<f>> => {
  return ws.send_update(sub, params) as Promise<tokens_update_response<f>>;
};
