// =========================
// `GET /stats` — hourly transaction counts by key type, post-quantum
// adoption, and totals. Cached for 10 seconds on the server.
// =========================

import type { http_client } from "../../client/http_client";
import type { key_stats_response } from "../../types/account";

export const get_key_stats = async (
  http: http_client,
): Promise<key_stats_response> => http.get<key_stats_response>("/stats");
