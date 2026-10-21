// =========================
// `tokens.search` — HTTP GET /tokens/search.
// =========================

import type { http_client } from "../../client/http_client";
import { assert_precision } from "../../types/common";
import type {
  token_requested_field,
  tokens_search_params,
  tokens_search_response,
} from "../../types/token";

export const search_tokens = async <f extends readonly token_requested_field[]>(
  http: http_client,
  params: tokens_search_params<f>,
): Promise<tokens_search_response<f>> => {
  if (params.precision !== undefined) assert_precision(params.precision);
  return http.get<tokens_search_response<f>>(
    "/tokens/search",
    params as unknown as Record<string, unknown>,
  );
};
