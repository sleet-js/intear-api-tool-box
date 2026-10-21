// =========================
// `GET /public_key/{key}` — accounts holding a full-access public key.
// Accepts ED25519, secp256k1, or an ML-DSA-65 handle.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { AccountsByPublicKeyResponse } from "../../types/account";

export const get_accounts_by_public_key = async (
  http: HttpClient,
  public_key: string,
): Promise<AccountsByPublicKeyResponse> => {
  const encoded = encodeURIComponent(public_key);
  return http.get<AccountsByPublicKeyResponse>(`/public_key/${encoded}`);
};
