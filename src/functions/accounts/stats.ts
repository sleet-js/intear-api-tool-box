// =========================
// `GET /stats` — hourly transaction counts by key type, post-quantum
// adoption, and totals. Cached for 10 seconds on the server.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { KeyStatsResponse } from "../../types/account";

export const get_key_stats = async (
  http: HttpClient,
): Promise<KeyStatsResponse> => http.get<KeyStatsResponse>("/stats");
