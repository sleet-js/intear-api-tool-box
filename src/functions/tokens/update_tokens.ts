// =========================
// `tokens.update` — adjust an existing `tokens.subscribe` in place by
// adding or removing token ids. Used for the "list of tokens on screen"
// pattern.
// =========================

import type { WsClient } from "../../client/ws_client";
import type {
  TokenRequestedField,
  TokensUpdateResponse,
  SubscriptionUpdateParams,
} from "../../types/token";

export const update_tokens = async <F extends readonly TokenRequestedField[]>(
  ws: WsClient,
  sub: number | string,
  params: SubscriptionUpdateParams,
): Promise<TokensUpdateResponse<F>> => {
  return ws.send_update(sub, params) as Promise<TokensUpdateResponse<F>>;
};
