// =========================
// Shared shape types used across every endpoint: the wire-protocol envelopes,
// the common `{ columns, rows }` table, and the limits pulled from `hello`.
// =========================

import type { DecimalString } from "../helpers/brand";

// =========================
// Envelope types the server sends. Every reply and every push has
// `credits_used`; results and pushes additionally carry `height` and
// `timestamp_millis`; the very first message on the wire is `hello`.
// =========================

export interface ServerError {
  code: string;
  message: string;
}

export interface Limits {
  max_pending_requests: number;
  max_subscriptions: number;
  max_ids_list: number;
  max_balances_accounts: number;
  max_history_rows: number;
  max_after_rows: number;
  max_message_bytes: number;
}

export interface HelloMessage {
  version: number;
  height: number;
  timestamp_millis: number;
  limits: Limits;
}

export interface IdleMessage {
  height: number;
  timestamp_millis: number;
}

export interface ReplyEnvelope<T> {
  result: T;
  credits_used: number;
}

export interface ErrorEnvelope {
  error: ServerError;
  credits_used: number;
}

export interface PushEnvelopeBase {
  sub: number | string;
  height: number;
  timestamp_millis: number;
  credits_used: number;
}

// =========================
// The `{ columns, rows }` table shape the API uses for tokens, trades,
// transfers, balances and holders. Each row is a tuple whose position matches
// the column name at the same index. The first column is always the row's key
// (account ID for tokens, event id for trades, …).
// `TCol` is the consumer-friendly tuple of field types (in the order you asked
// for them via `fields`). Use `table_to_objects(table)` if you'd rather have a
// `Record<key, fields>` shape.
// =========================
export interface Table<TCol extends readonly unknown[]> {
  columns: readonly [string, ...string[]];
  rows: ReadonlyArray<readonly [...TCol]>;
}

// =========================
// Paged responses (trades.query, transfers.query, holders.get, activity.query)
// additionally carry `next_cursor` and `latest_id` / `last` so a caller can
// iterate history.
// =========================
export interface PagedTable<TCol extends readonly unknown[]>
  extends Table<TCol> {
  next_cursor: string | null;
  latest_id?: number;
  last?: string;
  total?: number;
  missing?: readonly string[];
}

export interface ResumedTable {
  height: number;
  timestamp_millis: number;
  resumed: boolean;
}

// =========================
// Reputation enum, shared by token `where: { min_reputation }` and the
// `reputation` field on Token.
// =========================
export const REPUTATIONS = ["Spam", "Unknown", "NotFake", "Reputable"] as const;
export type Reputation = (typeof REPUTATIONS)[number];

export const is_reputation = (s: string): s is Reputation =>
  (REPUTATIONS as readonly string[]).includes(s);

// =========================
// Thresholds for `min_change` / `min_interval_ms` / `precision`. The API
// allows only specific values; we type them as literal unions so passing a
// wrong value is a compile error.
// =========================
export const MIN_CHANGE_THRESHOLDS = [
  "0.01%",
  "0.1%",
  "0.25%",
  "0.5%",
  "1%",
  "2%",
  "5%",
  "10%",
] as const;
export type MinChangeThreshold = (typeof MIN_CHANGE_THRESHOLDS)[number];

export const MIN_INTERVAL_MS_VALUES = [200, 600, 1000, 5000, 15000, 60000] as const;
export type MinIntervalMs = (typeof MIN_INTERVAL_MS_VALUES)[number];

export const PRECISION_RANGE = { MIN: 1, MAX: 30 } as const;
export type Precision = number; // 1..30, validated at call site

// =========================
// Helpers to assert/validate numeric ranges at runtime. We use lightweight
// getters that throw nice errors instead of heavy Zod-style validation.
// =========================
export const assert_precision = (n: number): void => {
  if (!Number.isInteger(n) || n < PRECISION_RANGE.MIN || n > PRECISION_RANGE.MAX) {
    throw new RangeError(`precision must be an integer 1..30 (got ${n})`);
  }
};

export const assert_min_interval_ms = (n: number): void => {
  if (!(MIN_INTERVAL_MS_VALUES as readonly number[]).includes(n)) {
    throw new RangeError(
      `min_interval_ms must be one of ${MIN_INTERVAL_MS_VALUES.join(", ")} (got ${n})`,
    );
  }
};

// =========================
// Re-export the brand so consumers can `import { DecimalString }` from a
// single types barrel if they want.
// =========================
export type { DecimalString } from "../helpers/brand";
