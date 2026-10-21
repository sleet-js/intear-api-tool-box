// =========================
// Accounts: search by prefix, look up by public key, network stats.
// =========================

export interface AccountRow {
  account_id: string;
  last_transaction_millis: number | null;
}

export interface AccountsSearchParams {
  prefix: string;
  limit?: number;
}

export interface AccountsSearchResponse {
  height: number;
  timestamp_millis: number;
  columns: readonly ["account_id", "last_transaction_millis"];
  rows: ReadonlyArray<readonly [string, number | null]>;
}

export interface AccountsByPublicKeyResponse {
  public_key: string | null;
  account_ids: readonly string[];
}

export interface KeyStatsHourlyTransactionsByKeyType {
  hour: string;
  ed25519: number;
  secp256k1: number;
  ml_dsa_65: number;
}

export interface KeyStatsHourlyPqAdoption {
  hour: string;
  active_accounts: number;
  exclusively_ml_dsa_65_accounts: number;
}

export interface KeyStatsTotals {
  quantum_safe_accounts: number;
  quantum_safe_transactions: number;
}

export interface KeyStatsResponse {
  hourly_transactions_by_key_type: readonly KeyStatsHourlyTransactionsByKeyType[];
  hourly_pq_adoption: readonly KeyStatsHourlyAdoption[];
  totals: KeyStatsTotals;
}

// The upstream name uses `pq_adoption`; we type both shapes tolerantly.
export interface KeyStatsHourlyAdoption {
  hour: string;
  active_accounts?: number;
  exclusively_ml_dsa_65_accounts?: number;
}
