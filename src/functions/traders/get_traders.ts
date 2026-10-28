// =========================
// `traders.get` — HTTP GET /traders. A token's top traders by profit over
// a time range, highest `pnl_usd` first.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  traders_get_params,
  traders_get_response,
} from "../../types/trader";

export const get_traders = async (
  http: http_client,
  params: traders_get_params,
): Promise<traders_get_response> =>
  http.get<traders_get_response>(
    "/traders",
    params as unknown as Record<string, unknown>,
  );
