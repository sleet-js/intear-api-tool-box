// =========================
// Strict, per-field types for tokens.
//
// Design: every known token field has its own entry in `token_value_by_field`.
// `token_field` is the union of keys. `token_value<F>` looks up the field's TS
// type. `token_row<F>` is the tuple type returned for a `fields: F` request:
//
//   const t = await client.tokens.get({ fields: ['symbol','price_usd'], ids: ['wrap.near'] });
//   const row = t.rows[0]; // readonly ['wrap.near', 'wNEAR', '4.815189744118901']
//   row[0] is string      // account_id (always first)
//   row[1] is string      // symbol
//   row[2] is DECIMAL_STRING // price_usd
//
// Fields not in the API docs are typed as `unknown` so missing definitions
// surface during development instead of silently slipping to `any`.
// =========================

import type { DECIMAL_STRING, ICON_HASH } from "../helpers/brand";
import type {
  min_change_threshold,
  reputation,
} from "./common";

export type token_value_by_field = {
  account_id: string;
  name: string;
  symbol: string;
  decimals: number;
  reference: string | null;
  icon: string | null;
  thumbnail: string | null;
  icon_hash: ICON_HASH | null;
  price_usd: DECIMAL_STRING;
  price_usd_raw: DECIMAL_STRING;
  price_usd_hardcoded: DECIMAL_STRING;
  price_near: DECIMAL_STRING;
  ath_price_usd_raw: DECIMAL_STRING;
  main_pool: string | null;
  main_pool_url: string | null;
  liquidity: DECIMAL_STRING;
  liquidity_usd: number;
  market_cap_usd: number;
  fdv_usd: number;
  total_supply: DECIMAL_STRING;
  circulating_supply: DECIMAL_STRING;
  circulating_supply_excluding_team: DECIMAL_STRING;
  total_supply_with_decimals: DECIMAL_STRING;
  circulating_supply_with_decimals: DECIMAL_STRING;
  circulating_supply_excluding_team_with_decimals: DECIMAL_STRING;
  holders: number;
  reputation: reputation;
  socials: Record<string, string> | null;
  description: string | null;
  dev: string | null;
  deleted: boolean;
  created_at: number;
  created_at_millis: number;
  buys_5m: number;
  buys_15m: number;
  buys_1h: number;
  buys_6h: number;
  buys_24h: number;
  sells_5m: number;
  sells_15m: number;
  sells_1h: number;
  sells_6h: number;
  sells_24h: number;
  traders_5m: number;
  traders_15m: number;
  traders_1h: number;
  traders_6h: number;
  traders_24h: number;
  volume_usd_5m: number;
  volume_usd_15m: number;
  volume_usd_1h: number;
  volume_usd_6h: number;
  volume_usd_24h: number;
  price_usd_raw_5m_ago: DECIMAL_STRING;
  price_usd_raw_15m_ago: DECIMAL_STRING;
  price_usd_raw_1h_ago: DECIMAL_STRING;
  price_usd_raw_6h_ago: DECIMAL_STRING;
  price_usd_raw_24h_ago: DECIMAL_STRING;
  price_change_5m: number | null;
  price_change_15m: number | null;
  price_change_1h: number | null;
  price_change_6h: number | null;
  price_change_24h: number | null;
  height: number;
  timestamp_millis: number;
};

export type token_field = keyof token_value_by_field;

// `account_id` is always first and is auto-included by the server.
export type token_requested_field = Exclude<token_field, "account_id" | "height" | "timestamp_millis">;
export type token_field_value<f extends token_requested_field> = token_value_by_field[f];

// A token row is `[account_id, ...requestedFields]` (then height/timestamp
// come back via the response envelope, not in the row). Use `token_rows<F>`.
export type token_row<f extends readonly token_requested_field[]> = readonly [
  string,
  ...{ [k in keyof f]: f[k] extends token_requested_field ? token_value_by_field[f[k]] : never },
];

// =========================
// Where filters for tokens.get / tokens.subscribe.
// =========================
export interface token_where {
  parent?: string | readonly string[];
  min_reputation?: reputation;
  deleted?: boolean;
  min?: Partial<Record<token_requested_field, number>>;
  max?: Partial<Record<token_requested_field, number>>;
  created_after_millis?: number;
}

// =========================
// Sort options. Server requires `sort` only for `fields: […]` numeric entries.
// =========================
export interface token_sort {
  by: token_requested_field;
  desc?: boolean;
}

// =========================
// `min_change` lets you throttle when a field is sent. The server only
// supports the documented set of threshold values per field.
// =========================
export type token_min_change = Partial<Record<token_requested_field, min_change_threshold>>;

// =========================
// Get params.
// =========================
export interface tokens_get_params<f extends readonly token_requested_field[] = readonly token_requested_field[]> {
  fields: f;
  ids?: readonly string[];
  where?: token_where;
  sort?: token_sort;
  limit?: number;
  offset?: number;
  precision?: number;
  min_change?: token_min_change;
  since?: number;
}

export interface tokens_get_response<f extends readonly token_requested_field[]> {
  height: number;
  timestamp_millis: number;
  columns: readonly ["account_id", ...f];
  rows: ReadonlyArray<token_row<f>>;
  total: number;
  missing: readonly string[];
  resumed?: boolean;
  left?: readonly string[];
}

// =========================
// Search params.
// =========================
export interface tokens_search_params<f extends readonly token_requested_field[]> {
  q: string;
  fields: f;
  limit?: number;
  min_reputation?: reputation;
  holder?: string;
  parent?: string | readonly string[];
  precision?: number;
}

export type tokens_search_response<f extends readonly token_requested_field[]> = Pick<
  tokens_get_response<f>,
  "height" | "timestamp_millis" | "columns" | "rows"
>;

// =========================
// Subscribe params — same as get except no `offset` / `since`, plus
// `min_interval_ms`, `snapshot`, and `resume_from`.
// =========================
export interface tokens_subscribe_params<f extends readonly token_requested_field[]> {
  fields: f;
  ids?: readonly string[];
  where?: token_where;
  sort?: token_sort;
  limit?: number;
  precision?: number;
  min_change?: token_min_change;
  min_interval_ms?: number;
  snapshot?: boolean;
  resume_from?: number;
}

export interface tokens_subscribe_response<f extends readonly token_requested_field[]>
  extends tokens_get_response<f> {
  resumed?: boolean;
}

export type token_push<f extends readonly token_requested_field[]> = {
  height: number;
  timestamp_millis: number;
  set?: Readonly<Record<string, Partial<{ [k in f[number]]: token_value_by_field[k & token_requested_field] }>>>;
  created?: readonly string[];
  left?: readonly string[];
};

// =========================
// `tokens.update` lets a subscription with `ids` add or remove tokens in
// place. The response is a normal tokens table for the new additions.
// =========================
export interface subscription_update_params {
  add?: readonly string[];
  remove?: readonly string[];
}

export interface tokens_update_response<f extends readonly token_requested_field[]>
  extends tokens_get_response<f> {}
