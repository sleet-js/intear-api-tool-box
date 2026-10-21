// =========================
// `GET /public_key/{key}` — accounts holding a full-access public key.
// Accepts ED25519, secp256k1, or an ML-DSA-65 handle.
// =========================

import type { http_client } from "../../client/http_client";
import type { accounts_by_public_key_response } from "../../types/account";

export const get_accounts_by_public_key = async (
  http: http_client,
  public_key: string,
): Promise<accounts_by_public_key_response> => {
  const encoded = encodeURIComponent(public_key);
  return http.get<accounts_by_public_key_response>(`/public_key/${encoded}`);
};
