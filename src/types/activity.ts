// =========================
// Activity: an account's trades + transfers + transactions as one stream.
// Columns are nested per-kind (the activity shape is genuinely different from
// the other endpoints), so we model it with an optional column per kind and
// `rows` as `[kind, ...fields][]`. Callers narrow on `kind` to read fields.
//
//   for (const row of activity.rows) {
//     switch (row[0]) {
//       case 'trade':      /* row is [kind, id, ...TradeFields] */
//       case 'transfer':   /* row is [kind, id, ...TransferFields] */
//       case 'transaction':/* row is [kind, id, ...TransactionFields] */
//     }
//   }
// =========================

import type { trade_requested_field, trade_side, min_usd } from "./trade";
import type {
  transfer_requested_field,
  transfer_kind,
} from "./transfer";

export type activity_kind = "trade" | "transfer" | "transaction";

// =========================
// Transaction fields surface in activity rows. They are a strict subset of
// transfer fields plus `height` / `timestamp_millis` which the row already
// carries.
// =========================
export type transaction_requested_field =
  | "transaction_id"
  | "sender"
  | "receiver"
  | "height"
  | "timestamp_millis";

// =========================
// Per-kind field requests. Each entry is the list of fields the consumer
// wants for that kind; if absent, no rows of that kind are returned.
// =========================
export interface activity_fields {
  trade?: readonly trade_requested_field[];
  transfer?: readonly transfer_requested_field[];
  transaction?: readonly transaction_requested_field[];
}

export interface activity_params {
  account: string;
  kinds: readonly activity_kind[];
  fields: activity_fields;
  token?: string;
  side?: trade_side;
  min_usd?: min_usd;
  include_liquidity?: boolean;
}

export type activity_order = "newest" | "oldest";

export interface activity_query_params extends activity_params {
  limit?: number;
  cursor?: string;
  after_millis?: number;
  before_millis?: number;
  order?: activity_order;
}

// =========================
// The response column map mirrors the request, but with `id` always first in
// each kind (the row's id column). The trade row also gets `id` first.
// =========================
export interface activity_columns {
  trade?: readonly ["id", ...trade_requested_field[]];
  transfer?: readonly ["id", ...transfer_requested_field[]];
  transaction?: readonly ["id", ...transaction_requested_field[]];
}

// =========================
// Each row is `[kind, ...columns]`. Fields are typed `unknown` because they
// depend on the kind-specific `columns` the caller requested; switching on
// `row[0]` narrows the rest of the tuple at the call site.
// =========================
export type activity_row = readonly [activity_kind, ...unknown[]];

export interface activity_response {
  height: number;
  timestamp_millis: number;
  columns: activity_columns;
  rows: ReadonlyArray<activity_row>;
  next_cursor: string | null;
  last: string;
}

// =========================
// Subscribe: history-then-live. Pass either `history` or `after`, not both.
// =========================
export interface activity_subscribe_params extends activity_params {
  history?: number;
  after?: string;
}

export type activity_subscribe_response = activity_response;

export type activity_push = {
  height: number;
  timestamp_millis: number;
  rows: ReadonlyArray<activity_row>;
  last: string;
};

// Re-export the kind for callers' convenience.
export type { trade_side, transfer_kind };
