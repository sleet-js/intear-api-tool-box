// =========================
// `positions.get` — HTTP GET /positions. An account's open + closed
// positions built from its swap history.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  PositionsGetParams,
  PositionsResponse,
} from "../../types/position";

export const get_positions = async (
  http: HttpClient,
  params: PositionsGetParams,
): Promise<PositionsResponse> =>
  http.get<PositionsResponse>(
    "/positions",
    params as unknown as Record<string, unknown>,
  );
