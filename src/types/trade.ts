// =========================
// Strict, per-field types for trades.
// Same scheme as `types/token.ts`: a per-field value map, a field union, and a
// row tuple narrowed by the requested `fields`.
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";

export type trade_value_by_field = {
  id: number;
  height: number;
  timestamp_millis: number;
  trader: string;
  pool_id: string;
  pool_url: string;
  transaction_id: string;
  receipt_id: string;
  token_in: string | null;
  amount_in: DECIMAL_STRING | null;
  token_out: string | null;
  amount_out: DECIMAL_STRING | null;
  token: string;
  amount: DECIMAL_STRING;
  counterparty: string;
  counterparty_amount: DECIMAL_STRING;
  side: trade_side;
  usd_value: DECIMAL_STRING | null;
  referrer: string | null;
};

export type trade_field = keyof trade_value_by_field;
export type trade_requested_field = Exclude<trade_field, "id" | "height" | "timestamp_millis">;
export type trade_field_value<f extends trade_requested_field> = trade_value_by_field[f];
export type trade_row<f extends readonly trade_requested_field[]> = readonly [
  number,
  ...{ [k in keyof f]: f[k] extends trade_requested_field ? trade_value_by_field[f[k]] : never },
];

export const TRADE_SIDES = ["sell", "buy", "add_liquidity", "remove_liquidity"] as const;
export type trade_side = (typeof TRADE_SIDES)[number];
export const is_trade_side = (s: string): s is trade_side =>
  (TRADE_SIDES as readonly string[]).includes(s);

export const MIN_USD_VALUES = [10, 50, 100, 500, 1000, 5000, 10_000] as const;
export type min_usd = (typeof MIN_USD_VALUES)[number];

export interface trades_filters<f extends readonly trade_requested_field[]> {
  fields: f;
  token?: string | readonly string[];
  parent?: string | readonly string[];
  counterparty?: string;
  trader?: string;
  side?: trade_side;
  include_liquidity?: boolean;
  min_usd?: min_usd;
}

export type trades_order = "newest" | "oldest";

export interface trades_query_params<f extends readonly trade_requested_field[]> extends trades_filters<f> {
  limit?: number;
  cursor?: string;
  after_millis?: number;
  before_millis?: number;
  order?: trades_order;
}

export interface trades_query_response<f extends readonly trade_requested_field[]> {
  height: number;
  timestamp_millis: number;
  columns: readonly ["id", ...f];
  rows: ReadonlyArray<trade_row<f>>;
  next_cursor: string | null;
  latest_id: number;
}

// =========================
// Subscribe: history-then-live. Pass either `history` or `after_id`, not both.
// =========================
export interface trades_subscribe_params<f extends readonly trade_requested_field[]> extends trades_filters<f> {
  history?: number;
  after_id?: number;
}

export type trades_subscribe_response<f extends readonly trade_requested_field[]> =
  trades_query_response<f>;

export type trade_push<f extends readonly trade_requested_field[]> = {
  height: number;
  timestamp_millis: number;
  rows: ReadonlyArray<trade_row<f>>;
};
