// =========================
// Miscellaneous endpoints: prices.at, public_key, stats, cosmetics, schema,
// icons. Plus the limit/credit constants we hand to the WS client.
// =========================

import type { DECIMAL_STRING } from "../helpers/brand";

export interface prices_at_query {
  token: string;
  timestamp_millis: number;
}

export interface prices_at_params {
  queries: readonly prices_at_query[];
}

export type prices_at_response = {
  height: number;
  timestamp_millis: number;
  prices: readonly (DECIMAL_STRING | null)[];
};

// =========================
// Schema is the live API definition; we don't strictly type it (it changes),
// but we export the field names of the parts we care about for runtime use
// (e.g. credit cost, window labels).
// =========================
export interface api_schema {
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
export interface cosmetic_referrer {
  emoji?: string;
  telegram_custom_emoji_id?: string;
  name?: string;
  icon?: string;
}

export interface cosmetic_user {
  emoji?: string;
}

export interface cosmetics_response {
  referrers: Readonly<Record<string, cosmetic_referrer>>;
  users: Readonly<Record<string, cosmetic_user>>;
}
