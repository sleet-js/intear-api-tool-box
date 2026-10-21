// =========================
// Strict, per-field types for trades.
// Same scheme as `types/token.ts`: a per-field value map, a field union, and a
// row tuple narrowed by the requested `fields`.
// =========================

import type { DecimalString } from "../helpers/brand";

export type TradeValueByField = {
  id: number;
  height: number;
  timestamp_millis: number;
  trader: string;
  pool_id: string;
  pool_url: string;
  transaction_id: string;
  receipt_id: string;
  token_in: string | null;
  amount_in: DecimalString | null;
  token_out: string | null;
  amount_out: DecimalString | null;
  token: string;
  amount: DecimalString;
  counterparty: string;
  counterparty_amount: DecimalString;
  side: TradeSide;
  usd_value: DecimalString | null;
  referrer: string | null;
};

export type TradeField = keyof TradeValueByField;
export type TradeRequestedField = Exclude<TradeField, "id" | "height" | "timestamp_millis">;
export type TradeFieldValue<F extends TradeRequestedField> = TradeValueByField[F];
export type TradeRow<F extends readonly TradeRequestedField[]> = readonly [
  number,
  ...{ [K in keyof F]: F[K] extends TradeRequestedField ? TradeValueByField[F[K]] : never },
];

export const TRADE_SIDES = ["sell", "buy", "add_liquidity", "remove_liquidity"] as const;
export type TradeSide = (typeof TRADE_SIDES)[number];
export const is_trade_side = (s: string): s is TradeSide =>
  (TRADE_SIDES as readonly string[]).includes(s);

export const MIN_USD_VALUES = [10, 50, 100, 500, 1000, 5000, 10_000] as const;
export type MinUsd = (typeof MIN_USD_VALUES)[number];

export interface TradesFilters<F extends readonly TradeRequestedField[]> {
  fields: F;
  token?: string | readonly string[];
  parent?: string | readonly string[];
  counterparty?: string;
  trader?: string;
  side?: TradeSide;
  include_liquidity?: boolean;
  min_usd?: MinUsd;
}

export type TradesOrder = "newest" | "oldest";

export interface TradesQueryParams<F extends readonly TradeRequestedField[]> extends TradesFilters<F> {
  limit?: number;
  cursor?: string;
  after_millis?: number;
  before_millis?: number;
  order?: TradesOrder;
}

export interface TradesQueryResponse<F extends readonly TradeRequestedField[]> {
  height: number;
  timestamp_millis: number;
  columns: readonly ["id", ...F];
  rows: ReadonlyArray<TradeRow<F>>;
  next_cursor: string | null;
  latest_id: number;
}

// =========================
// Subscribe: history-then-live. Pass either `history` or `after_id`, not both.
// =========================
export interface TradesSubscribeParams<F extends readonly TradeRequestedField[]> extends TradesFilters<F> {
  history?: number;
  after_id?: number;
}

export type TradesSubscribeResponse<F extends readonly TradeRequestedField[]> =
  TradesQueryResponse<F>;

export type TradePush<F extends readonly TradeRequestedField[]> = {
  height: number;
  timestamp_millis: number;
  rows: ReadonlyArray<TradeRow<F>>;
};
