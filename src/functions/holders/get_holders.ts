// =========================
// `holders.get` — HTTP GET /holders. Paged by `cursor`.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  HoldersGetParams,
  HoldersGetResponse,
} from "../../types/holder";

export const get_holders = async (
  http: HttpClient,
  params: HoldersGetParams,
): Promise<HoldersGetResponse> =>
  http.get<HoldersGetResponse>("/holders", params as unknown as Record<string, unknown>);
