// =========================
// Balances (an account's direct token holdings, native NEAR, and Rhea
// deposits).
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";
import type { token_requested_field } from "./token";
import type { min_change_threshold } from "./common";

export const BALANCE_SOURCES = ["direct", "native", "rhea"] as const;
export type balance_source = (typeof BALANCE_SOURCES)[number];

export interface balance_row {
  token: string;
  source: balance_source;
  balance: DECIMAL_STRING;
}

export interface balance_table {
  columns: readonly ["token", "source", "balance"];
  rows: ReadonlyArray<readonly [string, balance_source, DECIMAL_STRING]>;
}

export interface balances_get_params {
  account: string;
  sources: readonly balance_source[];
  tokens?: readonly string[];
  token_fields?: readonly token_requested_field[];
}

export interface balances_get_response<f extends readonly token_requested_field[] = readonly token_requested_field[]> {
  height: number;
  timestamp_millis: number;
  balances: balance_table;
  unknown: readonly string[];
  errors: Readonly<Partial<Record<balance_source, { code: string; message: string }>>>;
  tokens?: {
    columns: readonly ["account_id", ...f];
    rows: ReadonlyArray<readonly [string, ...{ [k in keyof f]: unknown }]>;
  };
}

export interface balances_subscribe_params extends balances_get_params {
  token_min_change?: Partial<Record<token_requested_field, min_change_threshold>>;
}

export type balances_subscribe_response<f extends readonly token_requested_field[]> =
  balances_get_response<f>;

export type balance_push = {
  height: number;
  timestamp_millis: number;
  balances: Readonly<Record<string, DECIMAL_STRING>>;
  set?: Readonly<Record<string, Record<string, unknown>>>;
  not_live?: readonly balance_source[];
};
