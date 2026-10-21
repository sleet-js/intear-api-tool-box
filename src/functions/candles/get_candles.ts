// =========================
// `candles.get` — HTTP GET /candles. Up to 200 tokens per call; column shape
// `time`, `usd.{open,high,low,close,volume?}`, optionally `near.*`.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  CandlesGetParams,
  CandlesResponse,
} from "../../types/candle";

export const get_candles = async (
  http: HttpClient,
  params: CandlesGetParams,
): Promise<CandlesResponse> => {
  return http.get<CandlesResponse>(
    "/candles",
    params as unknown as Record<string, unknown>,
  );
};
