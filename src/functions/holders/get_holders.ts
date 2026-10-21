// =========================
// `holders.get` — HTTP GET /holders. Paged by `cursor`.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  holders_get_params,
  holders_get_response,
} from "../../types/holder";

export const get_holders = async (
  http: http_client,
  params: holders_get_params,
): Promise<holders_get_response> =>
  http.get<holders_get_response>("/holders", params as unknown as Record<string, unknown>);
