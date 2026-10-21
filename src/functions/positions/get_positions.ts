// =========================
// `positions.get` — HTTP GET /positions. An account's open + closed
// positions built from its swap history.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  positions_get_params,
  positions_response,
} from "../../types/position";

export const get_positions = async (
  http: http_client,
  params: positions_get_params,
): Promise<positions_response> =>
  http.get<positions_response>(
    "/positions",
    params as unknown as Record<string, unknown>,
  );
