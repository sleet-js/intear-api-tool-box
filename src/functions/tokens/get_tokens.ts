// =========================
// `tokens.get` — HTTP GET /tokens. Strictly typed response keyed by the
// requested fields. Caller-supplied `fields` is preserved through the generic
// so `t.rows[0][2]` is `DecimalString` for `price_usd`, not `string`.
// =========================

import type { HttpClient } from "../../client/http_client";
import { assert_precision } from "../../types/common";
import type {
  TokenRequestedField,
  TokensGetParams,
  TokensGetResponse,
} from "../../types/token";

export const get_tokens = async <F extends readonly TokenRequestedField[]>(
  http: HttpClient,
  params: TokensGetParams<F>,
): Promise<TokensGetResponse<F>> => {
  if (params.precision !== undefined) assert_precision(params.precision);
  return http.get<TokensGetResponse<F>>(
    "/tokens",
    params as unknown as Record<string, unknown>,
  );
};
