// =========================
// Miscellaneous endpoints: prices.at, public_key, stats, cosmetics, schema,
// icons. Plus the limit/credit constants we hand to the WS client.
// =========================

import type { DecimalString } from "../helpers/brand";

export interface PricesAtQuery {
  token: string;
  timestamp_millis: number;
}

export interface PricesAtParams {
  queries: readonly PricesAtQuery[];
}

export type PricesAtResponse = {
  height: number;
  timestamp_millis: number;
  prices: readonly (DecimalString | null)[];
};

// =========================
// Schema is the live API definition; we don't strictly type it (it changes),
// but we export the field names of the parts we care about for runtime use
// (e.g. credit cost, window labels).
// =========================
export interface ApiSchema {
  version: number;
  token_fields: ReadonlyArray<{ name: string; type: string; kind: string }>;
  windows: readonly string[];
  thresholds: readonly string[];
  intervals_ms: readonly number[];
  limits: Record<string, number>;
  trade_fields: ReadonlyArray<{ name: string; type: string }>;
  transfer_fields: ReadonlyArray<{ name: string; type: string }>;
  transaction_fields: ReadonlyArray<{ name: string; type: string }>;
  methods: Record<string, { params?: unknown; http?: string }>;
}

// =========================
// Cosmetics maps referrer/aggregator apps and user handles to names and icons.
// =========================
export interface CosmeticReferrer {
  emoji?: string;
  telegram_custom_emoji_id?: string;
  name?: string;
  icon?: string;
}

export interface CosmeticUser {
  emoji?: string;
}

export interface CosmeticsResponse {
  referrers: Readonly<Record<string, CosmeticReferrer>>;
  users: Readonly<Record<string, CosmeticUser>>;
}
