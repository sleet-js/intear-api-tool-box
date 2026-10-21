// =========================
// Positions (an account's cost-basis entries per token).
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";

export interface position_row {
  token: string;
  opened_at_millis: number | null;
  closed_at_millis: number | null;
  last_trade_millis: number;
  amount: DECIMAL_STRING;
  cost_usd: number;
  bought: DECIMAL_STRING;
  bought_usd: number;
  sold: DECIMAL_STRING;
  sold_usd: number;
  realized_pnl_usd: number;
  buys: number;
  sells: number;
}

export interface positions_columns {
  columns: readonly [
    "token",
    "opened_at_millis",
    "closed_at_millis",
    "last_trade_millis",
    "amount",
    "cost_usd",
    "bought",
    "bought_usd",
    "sold",
    "sold_usd",
    "realized_pnl_usd",
    "buys",
    "sells",
  ];
  rows: ReadonlyArray<
    readonly [
      string,
      number | null,
      number | null,
      number,
      DECIMAL_STRING,
      number,
      DECIMAL_STRING,
      number,
      DECIMAL_STRING,
      number,
      number,
      number,
      number,
    ]
  >;
}

export interface positions_response {
  height: number;
  timestamp_millis: number;
  since_millis: number | null;
  columns: positions_columns["columns"];
  rows: positions_columns["rows"];
}

export interface positions_get_params {
  account: string;
  limit?: number; // 1..1000, default 1000
}
