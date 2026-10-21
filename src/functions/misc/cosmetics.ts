// =========================
// `GET /cosmetics` — referrer app names/icons and trader emojis. Cached for
// a minute on the server.
// =========================

import type { http_client } from "../../client/http_client";
import type { cosmetics_response } from "../../types/schema";

export const get_cosmetics = async (http: http_client): Promise<cosmetics_response> =>
  http.get<cosmetics_response>("/cosmetics");
