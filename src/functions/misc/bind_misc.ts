// =========================
// `bind_misc(http, ws)` — cosmetics, schema, icons, plus `table_to_objects`.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { get_cosmetics } from "./cosmetics";
import { get_schema_http, get_schema_ws } from "./schema";
import { icon_url } from "./icon";
import { table_to_objects } from "./table_helpers";
import type { cosmetics_response } from "../../types/schema";
import type { api_schema } from "../../types/schema";

export interface misc_endpoints {
  cosmetics: () => Promise<cosmetics_response>;
  schema: () => Promise<api_schema>;
  icon_url: (icon_hash: string) => string;
  // Re-exported helper for ergonomics — same as `table_to_objects` import.
  table_to_objects: typeof table_to_objects;
}

export const bind_misc = (http: http_client, ws: ws_client): misc_endpoints => ({
  cosmetics: () => get_cosmetics(http),
  schema: async (): Promise<api_schema> => {
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
