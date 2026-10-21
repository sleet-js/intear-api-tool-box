// =========================
// `GET /cosmetics` — referrer app names/icons and trader emojis. Cached for
// a minute on the server.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { CosmeticsResponse } from "../../types/schema";

export const get_cosmetics = async (http: HttpClient): Promise<CosmeticsResponse> =>
  http.get<CosmeticsResponse>("/cosmetics");
