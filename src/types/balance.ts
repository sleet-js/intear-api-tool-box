// =========================
// Balances (an account's direct token holdings, native NEAR, and Rhea
// deposits).
// =========================

import type { DecimalString } from "../helpers/brand";
import type { TokenRequestedField } from "./token";
import type { MinChangeThreshold } from "./common";

export const BALANCE_SOURCES = ["direct", "native", "rhea"] as const;
export type BalanceSource = (typeof BALANCE_SOURCES)[number];

export interface BalanceRow {
  token: string;
  source: BalanceSource;
  balance: DecimalString;
}

export interface BalanceTable {
  columns: readonly ["token", "source", "balance"];
  rows: ReadonlyArray<readonly [string, BalanceSource, DecimalString]>;
}

export interface BalancesGetParams {
  account: string;
  sources: readonly BalanceSource[];
  tokens?: readonly string[];
  token_fields?: readonly TokenRequestedField[];
}

export interface BalancesGetResponse<F extends readonly TokenRequestedField[] = readonly TokenRequestedField[]> {
  height: number;
  timestamp_millis: number;
  balances: BalanceTable;
  unknown: readonly string[];
  errors: Readonly<Partial<Record<BalanceSource, { code: string; message: string }>>>;
  tokens?: {
    columns: readonly ["account_id", ...F];
    rows: ReadonlyArray<readonly [string, ...{ [K in keyof F]: unknown }]>;
  };
}

export interface BalancesSubscribeParams extends BalancesGetParams {
  token_min_change?: Partial<Record<TokenRequestedField, MinChangeThreshold>>;
}

export type BalancesSubscribeResponse<F extends readonly TokenRequestedField[]> =
  BalancesGetResponse<F>;

export type BalancePush = {
  height: number;
  timestamp_millis: number;
  balances: Readonly<Record<string, DecimalString>>;
  set?: Readonly<Record<string, Record<string, unknown>>>;
  not_live?: readonly BalanceSource[];
};
