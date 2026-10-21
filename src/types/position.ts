// =========================
// Positions (an account's cost-basis entries per token).
// =========================

import type { DecimalString } from "../helpers/brand";

export interface PositionRow {
  token: string;
  opened_at_millis: number | null;
  closed_at_millis: number | null;
  last_trade_millis: number;
  amount: DecimalString;
  cost_usd: number;
  bought: DecimalString;
  bought_usd: number;
  sold: DecimalString;
  sold_usd: number;
  realized_pnl_usd: number;
  buys: number;
  sells: number;
}

export interface PositionsColumns {
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
      DecimalString,
      number,
      DecimalString,
      number,
      DecimalString,
      number,
      number,
      number,
      number,
    ]
  >;
}

export interface PositionsResponse {
  height: number;
  timestamp_millis: number;
  since_millis: number | null;
  columns: PositionsColumns["columns"];
  rows: PositionsColumns["rows"];
}

export interface PositionsGetParams {
  account: string;
  limit?: number; // 1..1000, default 1000
}
