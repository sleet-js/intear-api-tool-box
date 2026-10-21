// =========================
// Strict types for transfers and transactions.
// `kind` (`transfer` | `transaction`) chooses which fields are populated in a
// given row. We express that with a small discriminated union at the value
// level plus a single field map; the narrow-by-fields projection in
// `TransferRow<F>` works the same as for tokens/trades.
// =========================

import type { DecimalString } from "../helpers/brand";

export type TransferKind = "transfer" | "transaction";

export type TransferValueByField = {
  id: number;
  kind: TransferKind;
  height: number;
  timestamp_millis: number;
  transaction_id: string | null;
  receipt_id: string | null;
  token: string | null;
  sender: string | null;
  receiver: string | null;
  amount: DecimalString | null;
};

export type TransferField = keyof TransferValueByField;
export type TransferRequestedField = Exclude<TransferField, "id" | "kind" | "height" | "timestamp_millis">;
export type TransferFieldValue<F extends TransferRequestedField> = TransferValueByField[F];

export type TransferRow<F extends readonly TransferRequestedField[]> = readonly [
  number,
  ...{ [K in keyof F]: F[K] extends TransferRequestedField ? TransferValueByField[F[K]] : never },
];

// Transaction fields are a strict subset: id/height/timestamp_millis/transaction_id/sender/receiver.
export type TransactionField = "id" | "height" | "timestamp_millis" | "transaction_id" | "sender" | "receiver";
export type TransactionRequestedField = Exclude<TransactionField, "id" | "height" | "timestamp_millis">;

export interface TransfersFilters<F extends readonly TransferRequestedField[]> {
  fields: F;
  token?: string | readonly string[];
  parent?: string | readonly string[];
  sender?: string;
  receiver?: string;
  account?: string;
  kind?: TransferKind;
  include_transactions?: boolean;
}

export type TransfersOrder = "newest" | "oldest";

export interface TransfersQueryParams<F extends readonly TransferRequestedField[]>
  extends TransfersFilters<F> {
  limit?: number;
  cursor?: string;
  after_millis?: number;
  before_millis?: number;
  order?: TransfersOrder;
}

export interface TransfersQueryResponse<F extends readonly TransferRequestedField[]>
  extends TransfersQueryResponseBase<F> {
  next_cursor: string | null;
  latest_id?: number;
  last?: string;
}

interface TransfersQueryResponseBase<F extends readonly TransferRequestedField[]> {
  height: number;
  timestamp_millis: number;
  columns: readonly ["id", ...F];
  rows: ReadonlyArray<TransferRow<F>>;
}

export interface TransfersSubscribeParams<F extends readonly TransferRequestedField[]>
  extends TransfersFilters<F> {
  history?: number;
  after_id?: number;
}

export type TransfersSubscribeResponse<F extends readonly TransferRequestedField[]> =
  TransfersQueryResponse<F>;

export type TransferPush<F extends readonly TransferRequestedField[]> = {
  height: number;
  timestamp_millis: number;
  rows: ReadonlyArray<TransferRow<F>>;
};
