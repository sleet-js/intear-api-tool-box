// =========================
// `tokens.get` — HTTP GET /tokens. Strictly typed response keyed by the
// requested fields. Caller-supplied `fields` is preserved through the generic
// so `t.rows[0][2]` is `DECIMAL_STRING` for `price_usd`, not `string`.
// =========================

import type { http_client } from "../../client/http_client";
import { assert_precision } from "../../types/common";
import type {
  token_requested_field,
  tokens_get_params,
  tokens_get_response,
} from "../../types/token";

export const get_tokens = async <f extends readonly token_requested_field[]>(
  http: http_client,
  params: tokens_get_params<f>,
): Promise<tokens_get_response<f>> => {
  if (params.precision !== undefined) assert_precision(params.precision);
  return http.get<tokens_get_response<f>>(
    "/tokens",
    params as unknown as Record<string, unknown>,
  );
};
