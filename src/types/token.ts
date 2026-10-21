// =========================
// Strict, per-field types for tokens.
//
// Design: every known token field has its own entry in `TokenValueByField`.
// `TokenField` is the union of keys. `TokenValue<F>` looks up the field's TS
// type. `TokenRow<F>` is the tuple type returned for a `fields: F` request:
//
//   const t = await client.tokens.get({ fields: ['symbol','price_usd'], ids: ['wrap.near'] });
//   const row = t.rows[0]; // readonly ['wrap.near', 'wNEAR', '4.815189744118901']
//   row[0] is string      // account_id (always first)
//   row[1] is string      // symbol
//   row[2] is DecimalString // price_usd
//
// Fields not in the API docs are typed as `unknown` so missing definitions
// surface during development instead of silently slipping to `any`.
// =========================

import type { DecimalString, IconHash } from "../helpers/brand";
import type {
  MinChangeThreshold,
  Reputation,
} from "./common";

export type TokenValueByField = {
  account_id: string;
  name: string;
  symbol: string;
  decimals: number;
  reference: string | null;
  icon: string | null;
  thumbnail: string | null;
  icon_hash: IconHash | null;
  price_usd: DecimalString;
  price_usd_raw: DecimalString;
  price_usd_hardcoded: DecimalString;
  price_near: DecimalString;
  ath_price_usd_raw: DecimalString;
  main_pool: string | null;
  main_pool_url: string | null;
  liquidity: DecimalString;
  liquidity_usd: number;
  market_cap_usd: number;
  fdv_usd: number;
  total_supply: DecimalString;
  circulating_supply: DecimalString;
  circulating_supply_excluding_team: DecimalString;
  total_supply_with_decimals: DecimalString;
  circulating_supply_with_decimals: DecimalString;
  circulating_supply_excluding_team_with_decimals: DecimalString;
  holders: number;
  reputation: Reputation;
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
  price_usd_raw_5m_ago: DecimalString;
  price_usd_raw_15m_ago: DecimalString;
  price_usd_raw_1h_ago: DecimalString;
  price_usd_raw_6h_ago: DecimalString;
  price_usd_raw_24h_ago: DecimalString;
  price_change_5m: number | null;
  price_change_15m: number | null;
  price_change_1h: number | null;
  price_change_6h: number | null;
  price_change_24h: number | null;
  height: number;
  timestamp_millis: number;
};

export type TokenField = keyof TokenValueByField;

// `account_id` is always first and is auto-included by the server.
export type TokenRequestedField = Exclude<TokenField, "account_id" | "height" | "timestamp_millis">;
export type TokenFieldValue<F extends TokenRequestedField> = TokenValueByField[F];

// A token row is `[account_id, ...requestedFields]` (then height/timestamp
// come back via the response envelope, not in the row). Use `TokenRows<F>`.
export type TokenRow<F extends readonly TokenRequestedField[]> = readonly [
  string,
  ...{ [K in keyof F]: F[K] extends TokenRequestedField ? TokenValueByField[F[K]] : never },
];

// =========================
// Where filters for tokens.get / tokens.subscribe.
// =========================
export interface TokenWhere {
  parent?: string | readonly string[];
  min_reputation?: Reputation;
  deleted?: boolean;
  min?: Partial<Record<TokenRequestedField, number>>;
  max?: Partial<Record<TokenRequestedField, number>>;
  created_after_millis?: number;
}

// =========================
// Sort options. Server requires `sort` only for `fields: […]` numeric entries.
// =========================
export interface TokenSort {
  by: TokenRequestedField;
  desc?: boolean;
}

// =========================
// `min_change` lets you throttle when a field is sent. The server only
// supports the documented set of threshold values per field.
// =========================
export type TokenMinChange = Partial<Record<TokenRequestedField, MinChangeThreshold>>;

// =========================
// Get params.
// =========================
export interface TokensGetParams<F extends readonly TokenRequestedField[] = readonly TokenRequestedField[]> {
  fields: F;
  ids?: readonly string[];
  where?: TokenWhere;
  sort?: TokenSort;
  limit?: number;
  offset?: number;
  precision?: number;
  min_change?: TokenMinChange;
  since?: number;
}

export interface TokensGetResponse<F extends readonly TokenRequestedField[]> {
  height: number;
  timestamp_millis: number;
  columns: readonly ["account_id", ...F];
  rows: ReadonlyArray<TokenRow<F>>;
  total: number;
  missing: readonly string[];
  resumed?: boolean;
  left?: readonly string[];
}

// =========================
// Search params.
// =========================
export interface TokensSearchParams<F extends readonly TokenRequestedField[]> {
  q: string;
  fields: F;
  limit?: number;
  min_reputation?: Reputation;
  holder?: string;
  parent?: string | readonly string[];
  precision?: number;
}

export type TokensSearchResponse<F extends readonly TokenRequestedField[]> = Pick<
  TokensGetResponse<F>,
  "height" | "timestamp_millis" | "columns" | "rows"
>;

// =========================
// Subscribe params — same as get except no `offset` / `since`, plus
// `min_interval_ms`, `snapshot`, and `resume_from`.
// =========================
export interface TokensSubscribeParams<F extends readonly TokenRequestedField[]> {
  fields: F;
  ids?: readonly string[];
  where?: TokenWhere;
  sort?: TokenSort;
  limit?: number;
  precision?: number;
  min_change?: TokenMinChange;
  min_interval_ms?: number;
  snapshot?: boolean;
  resume_from?: number;
}

export interface TokensSubscribeResponse<F extends readonly TokenRequestedField[]>
  extends TokensGetResponse<F> {
  resumed?: boolean;
}

export type TokenPush<F extends readonly TokenRequestedField[]> = {
  height: number;
  timestamp_millis: number;
  set?: Readonly<Record<string, Partial<{ [K in F[number]]: TokenValueByField[K & TokenRequestedField] }>>>;
  created?: readonly string[];
  left?: readonly string[];
};

// =========================
// `tokens.update` lets a subscription with `ids` add or remove tokens in
// place. The response is a normal tokens table for the new additions.
// =========================
export interface SubscriptionUpdateParams {
  add?: readonly string[];
  remove?: readonly string[];
}

export interface TokensUpdateResponse<F extends readonly TokenRequestedField[]>
  extends TokensGetResponse<F> {}
