// =========================
// Candles (a.k.a. price chart bars).
// =========================

import type { DecimalString } from "../helpers/brand";

export type CandleResolution =
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

export type CandleSeriesField = "open" | "high" | "low" | "close" | "volume";
export type CandleSeries = readonly CandleSeriesField[];

export type CandleQuote = "usd" | "near" | readonly ["usd", "near"];

export interface CandleSeriesData {
  open?: readonly (DecimalString | null)[];
  high?: readonly (DecimalString | null)[];
  low?: readonly (DecimalString | null)[];
  close?: readonly (DecimalString | null)[];
  volume?: readonly (DecimalString | null)[];
}

export interface CandleTokenData {
  time: readonly number[];
  usd?: CandleSeriesData;
  near?: CandleSeriesData;
}

export interface CandlesResponse {
  height: number;
  timestamp_millis: number;
  tokens: Readonly<Record<string, CandleTokenData>>;
  missing: readonly string[];
}

export interface CandlesGetParams {
  tokens: readonly string[];
  resolution: CandleResolution;
  quote?: CandleQuote;
  series?: CandleSeries;
  count_back?: number;
  to_millis?: number;
}

export interface CandlesSubscribeParams {
  tokens: readonly string[];
  resolution: CandleResolution;
  quote?: CandleQuote;
  series?: CandleSeries;
  count_back?: number;
}

export type CandlesSubscribeResponse = CandlesResponse;

export type CandlePush = {
  height: number;
  timestamp_millis: number;
  tokens: Readonly<Record<string, CandleTokenData>>;
};
