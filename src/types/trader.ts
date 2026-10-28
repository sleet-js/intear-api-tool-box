// =========================
// Traders (a token's top traders by profit over a time range).
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";

// The time range a trader's PnL is measured over.
export const TRADER_RANGES = ["24h", "7d", "30d", "all"] as const;
export type trader_range = (typeof TRADER_RANGES)[number];

export interface trader_row {
  account_id: string;
  pnl_usd: number;
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  bought_usd: number;
  sold_usd: number;
  buys: number;
  sells: number;
  held: DECIMAL_STRING;
}

export interface traders_table {
  columns: readonly [
    "account_id",
    "pnl_usd",
    "realized_pnl_usd",
    "unrealized_pnl_usd",
    "bought_usd",
    "sold_usd",
    "buys",
    "sells",
    "held",
  ];
  rows: ReadonlyArray<
    readonly [
      string,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      DECIMAL_STRING,
    ]
  >;
}

export interface traders_get_params {
  token: string;
  range: trader_range;
  top?: number; // 1..100, default 100
}

export interface traders_get_response {
  height: number;
  timestamp_millis: number;
  columns: traders_table["columns"];
  rows: traders_table["rows"];
}
