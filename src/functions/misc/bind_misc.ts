// =========================
// `bind_misc(http, ws)` — cosmetics, schema, icons, plus `table_to_objects`.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { get_cosmetics } from "./cosmetics";
import { get_schema_http, get_schema_ws } from "./schema";
import { icon_url } from "./icon";
import { table_to_objects } from "./table_helpers";
import type { CosmeticsResponse } from "../../types/schema";
import type { ApiSchema } from "../../types/schema";

export interface MiscEndpoints {
  cosmetics: () => Promise<CosmeticsResponse>;
  schema: () => Promise<ApiSchema>;
  icon_url: (icon_hash: string) => string;
  // Re-exported helper for ergonomics — same as `table_to_objects` import.
  table_to_objects: typeof table_to_objects;
}

export const bind_misc = (http: HttpClient, ws: WsClient): MiscEndpoints => ({
  cosmetics: () => get_cosmetics(http),
  schema: async (): Promise<ApiSchema> => {
    // Prefer HTTP since it can be cached, but fall back to the WS path. The
    // WS request awaits `hello` first; calling it eagerly is fine.
    try {
      return await get_schema_http(http);
    } catch {
      return get_schema_ws(ws);
    }
  },
  icon_url: (icon_hash) => icon_url(http, icon_hash),
  table_to_objects,
});
