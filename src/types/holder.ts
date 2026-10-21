// =========================
// Holders (a token's largest accounts).
// =========================

import type { DecimalString } from "../helpers/brand";

export interface HolderRow {
  account_id: string;
  balance: DecimalString;
}

export interface HoldersTable {
  columns: readonly ["account_id", "balance"];
  rows: ReadonlyArray<readonly [string, DecimalString]>;
}

export interface HoldersGetParams {
  token: string;
  limit?: number;
  cursor?: string;
}

export interface HoldersGetResponse {
  height: number;
  timestamp_millis: number;
  columns: HoldersTable["columns"];
  rows: HoldersTable["rows"];
  next_cursor: string | null;
  total: number;
}

export interface HoldersSubscribeParams {
  token: string;
  top: number; // 1..1000
}

export type HoldersSubscribeResponse = HoldersGetResponse;

export type HoldersPush = {
  height: number;
  timestamp_millis: number;
  set: Readonly<Record<string, DecimalString>>;
  left?: readonly string[];
};
