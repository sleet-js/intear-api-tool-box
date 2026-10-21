// =========================
// Holders (a token's largest accounts).
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";

export interface holder_row {
  account_id: string;
  balance: DECIMAL_STRING;
}

export interface holders_table {
  columns: readonly ["account_id", "balance"];
  rows: ReadonlyArray<readonly [string, DECIMAL_STRING]>;
}

export interface holders_get_params {
  token: string;
  limit?: number;
  cursor?: string;
}

export interface holders_get_response {
  height: number;
  timestamp_millis: number;
  columns: holders_table["columns"];
  rows: holders_table["rows"];
  next_cursor: string | null;
  total: number;
}

export interface holders_subscribe_params {
  token: string;
  top: number; // 1..1000
}

export type holders_subscribe_response = holders_get_response;

export type holders_push = {
  height: number;
  timestamp_millis: number;
  set: Readonly<Record<string, DECIMAL_STRING>>;
  left?: readonly string[];
};
