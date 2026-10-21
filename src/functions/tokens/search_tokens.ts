// =========================
// `tokens.search` — HTTP GET /tokens/search.
// =========================

import type { HttpClient } from "../../client/http_client";
import { assert_precision } from "../../types/common";
import type {
  TokenRequestedField,
  TokensSearchParams,
  TokensSearchResponse,
} from "../../types/token";

export const search_tokens = async <F extends readonly TokenRequestedField[]>(
  http: HttpClient,
  params: TokensSearchParams<F>,
): Promise<TokensSearchResponse<F>> => {
  if (params.precision !== undefined) assert_precision(params.precision);
  return http.get<TokensSearchResponse<F>>(
    "/tokens/search",
    params as unknown as Record<string, unknown>,
  );
};
