// =========================
// Strict types for transfers and transactions.
// `kind` (`transfer` | `transaction`) chooses which fields are populated in a
// given row. We express that with a small discriminated union at the value
// level plus a single field map; the narrow-by-fields projection in
// `transfer_row<F>` works the same as for tokens/trades.
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";

export type transfer_kind = "transfer" | "transaction";

export type transfer_value_by_field = {
  id: number;
  kind: transfer_kind;
  height: number;
  timestamp_millis: number;
  transaction_id: string | null;
  receipt_id: string | null;
  token: string | null;
  sender: string | null;
  receiver: string | null;
  amount: DECIMAL_STRING | null;
};

export type transfer_field = keyof transfer_value_by_field;
export type transfer_requested_field = Exclude<transfer_field, "id" | "kind" | "height" | "timestamp_millis">;
export type transfer_field_value<f extends transfer_requested_field> = transfer_value_by_field[f];

export type transfer_row<f extends readonly transfer_requested_field[]> = readonly [
  number,
  ...{ [k in keyof f]: f[k] extends transfer_requested_field ? transfer_value_by_field[f[k]] : never },
];

// Transaction fields are a strict subset: id/height/timestamp_millis/transaction_id/sender/receiver.
export type transaction_field = "id" | "height" | "timestamp_millis" | "transaction_id" | "sender" | "receiver";
export type transaction_requested_field = Exclude<transaction_field, "id" | "height" | "timestamp_millis">;

export interface transfers_filters<f extends readonly transfer_requested_field[]> {
  fields: f;
  token?: string | readonly string[];
  parent?: string | readonly string[];
  sender?: string;
  receiver?: string;
  account?: string;
  kind?: transfer_kind;
  include_transactions?: boolean;
}

export type transfers_order = "newest" | "oldest";

export interface transfers_query_params<f extends readonly transfer_requested_field[]>
  extends transfers_filters<f> {
  limit?: number;
  cursor?: string;
  after_millis?: number;
  before_millis?: number;
  order?: transfers_order;
}

export interface transfers_query_response<f extends readonly transfer_requested_field[]>
  extends transfers_query_response_base<f> {
  next_cursor: string | null;
  latest_id?: number;
  last?: string;
}

interface transfers_query_response_base<f extends readonly transfer_requested_field[]> {
  height: number;
  timestamp_millis: number;
  columns: readonly ["id", ...f];
  rows: ReadonlyArray<transfer_row<f>>;
}

export interface transfers_subscribe_params<f extends readonly transfer_requested_field[]>
  extends transfers_filters<f> {
  history?: number;
  after_id?: number;
}

export type transfers_subscribe_response<f extends readonly transfer_requested_field[]> =
  transfers_query_response<f>;

export type transfer_push<f extends readonly transfer_requested_field[]> = {
  height: number;
  timestamp_millis: number;
  rows: ReadonlyArray<transfer_row<f>>;
};
