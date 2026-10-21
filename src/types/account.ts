// =========================
// Accounts: search by prefix, look up by public key, network stats.
// =========================

export interface account_row {
  account_id: string;
  last_transaction_millis: number | null;
}

export interface accounts_search_params {
  prefix: string;
  limit?: number;
}

export interface accounts_search_response {
  height: number;
  timestamp_millis: number;
  columns: readonly ["account_id", "last_transaction_millis"];
  rows: ReadonlyArray<readonly [string, number | null]>;
}

export interface accounts_by_public_key_response {
  public_key: string | null;
  account_ids: readonly string[];
}

export interface key_stats_hourly_transactions_by_key_type {
  hour: string;
  ed25519: number;
  secp256k1: number;
  ml_dsa_65: number;
}

export interface key_stats_hourly_pq_adoption {
  hour: string;
  active_accounts: number;
  exclusively_ml_dsa_65_accounts: number;
}

export interface key_stats_totals {
  quantum_safe_accounts: number;
  quantum_safe_transactions: number;
}

export interface key_stats_response {
  hourly_transactions_by_key_type: readonly key_stats_hourly_transactions_by_key_type[];
  hourly_pq_adoption: readonly key_stats_hourly_adoption[];
  totals: key_stats_totals;
}

// The upstream name uses `pq_adoption`; we type both shapes tolerantly.
export interface key_stats_hourly_adoption {
  hour: string;
  active_accounts?: number;
  exclusively_ml_dsa_65_accounts?: number;
}
