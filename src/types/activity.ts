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

import type { TradeRequestedField, TradeSide, MinUsd } from "./trade";
import type {
  TransferRequestedField,
  TransferKind,
} from "./transfer";

export type ActivityKind = "trade" | "transfer" | "transaction";

// =========================
// Transaction fields surface in activity rows. They are a strict subset of
// transfer fields plus `height` / `timestamp_millis` which the row already
// carries.
// =========================
export type TransactionRequestedField =
  | "transaction_id"
  | "sender"
  | "receiver"
  | "height"
  | "timestamp_millis";

// =========================
// Per-kind field requests. Each entry is the list of fields the consumer
// wants for that kind; if absent, no rows of that kind are returned.
// =========================
export interface ActivityFields {
  trade?: readonly TradeRequestedField[];
  transfer?: readonly TransferRequestedField[];
  transaction?: readonly TransactionRequestedField[];
}

export interface ActivityParams {
  account: string;
  kinds: readonly ActivityKind[];
  fields: ActivityFields;
  token?: string;
  side?: TradeSide;
  min_usd?: MinUsd;
  include_liquidity?: boolean;
}

export type ActivityOrder = "newest" | "oldest";

export interface ActivityQueryParams extends ActivityParams {
  limit?: number;
  cursor?: string;
  after_millis?: number;
  before_millis?: number;
  order?: ActivityOrder;
}

// =========================
// The response column map mirrors the request, but with `id` always first in
// each kind (the row's id column). The trade row also gets `id` first.
// =========================
export interface ActivityColumns {
  trade?: readonly ["id", ...TradeRequestedField[]];
  transfer?: readonly ["id", ...TransferRequestedField[]];
  transaction?: readonly ["id", ...TransactionRequestedField[]];
}

// =========================
// Each row is `[kind, ...columns]`. Fields are typed `unknown` because they
// depend on the kind-specific `columns` the caller requested; switching on
// `row[0]` narrows the rest of the tuple at the call site.
// =========================
export type ActivityRow = readonly [ActivityKind, ...unknown[]];

export interface ActivityResponse {
  height: number;
  timestamp_millis: number;
  columns: ActivityColumns;
  rows: ReadonlyArray<ActivityRow>;
  next_cursor: string | null;
  last: string;
}

// =========================
// Subscribe: history-then-live. Pass either `history` or `after`, not both.
// =========================
export interface ActivitySubscribeParams extends ActivityParams {
  history?: number;
  after?: string;
}

export type ActivitySubscribeResponse = ActivityResponse;

export type ActivityPush = {
  height: number;
  timestamp_millis: number;
  rows: ReadonlyArray<ActivityRow>;
  last: string;
};

// Re-export the kind for callers' convenience.
export type { TradeSide, TransferKind };
