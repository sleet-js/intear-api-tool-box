// =========================
// `candles.get` — HTTP GET /candles. Up to 200 tokens per call; column shape
// `time`, `usd.{open,high,low,close,volume?}`, optionally `near.*`.
// =========================

import type { http_client } from "../../client/http_client";
import type {
  candles_get_params,
  candles_response,
} from "../../types/candle";

export const get_candles = async (
  http: http_client,
  params: candles_get_params,
): Promise<candles_response> => {
  return http.get<candles_response>(
    "/candles",
    params as unknown as Record<string, unknown>,
  );
};
