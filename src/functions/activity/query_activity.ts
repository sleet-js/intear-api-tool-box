// =========================
// `activity.query` — HTTP GET /activity. Mixed trades + transfers +
// transactions for a single account, newest first by default.
// =========================

import type { HttpClient } from "../../client/http_client";
import type {
  ActivityQueryParams,
  ActivityResponse,
} from "../../types/activity";

export const query_activity = async (
  http: HttpClient,
  params: ActivityQueryParams,
): Promise<ActivityResponse> => {
  // The activity endpoint nests its `fields` per kind; translate to dotted
  // keys (`fields.trade=…`, `fields.transfer=…`) so the URL encoder produces
  // the documented shape.
  const { fields, ...rest } = params;
  const flat: Record<string, unknown> = { ...(rest as Record<string, unknown>) };
  for (const [kind, ks] of Object.entries(fields)) {
    if (ks && ks.length > 0) flat[`fields.${kind}`] = ks.join(",");
  }
  return http.get<ActivityResponse>("/activity", flat);
};
