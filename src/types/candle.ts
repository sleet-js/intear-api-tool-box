// =========================
// Candles (a.k.a. price chart bars).
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";

export type candle_resolution =
  | "1S"
  | "1"
  | "1m"
  | "5"
  | "5m"
  | "15"
  | "15m"
  | "60"
  | "60m"
  | "1h"
  | "240"
  | "240m"
  | "4h"
  | "D"
  | "24h"
  | "1d"
  | "W"
  | "7d"
  | "1w";

export type candle_series_field = "open" | "high" | "low" | "close" | "volume";
export type candle_series = readonly candle_series_field[];

export type candle_quote = "usd" | "near" | readonly ["usd", "near"];

export interface candle_series_data {
  open?: readonly (DECIMAL_STRING | null)[];
  high?: readonly (DECIMAL_STRING | null)[];
  low?: readonly (DECIMAL_STRING | null)[];
  close?: readonly (DECIMAL_STRING | null)[];
  volume?: readonly (DECIMAL_STRING | null)[];
}

export interface candle_token_data {
  time: readonly number[];
  usd?: candle_series_data;
  near?: candle_series_data;
}

export interface candles_response {
  height: number;
  timestamp_millis: number;
  tokens: Readonly<Record<string, candle_token_data>>;
  missing: readonly string[];
}

export interface candles_get_params {
  tokens: readonly string[];
  resolution: candle_resolution;
  quote?: candle_quote;
  series?: candle_series;
  count_back?: number;
  to_millis?: number;
}

export interface candles_subscribe_params {
  tokens: readonly string[];
  resolution: candle_resolution;
  quote?: candle_quote;
  series?: candle_series;
  count_back?: number;
}

export type candles_subscribe_response = candles_response;

export type candle_push = {
  height: number;
  timestamp_millis: number;
  tokens: Readonly<Record<string, candle_token_data>>;
};
