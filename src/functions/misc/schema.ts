// =========================
// `schema` — the live API definition. Useful for tooling that wants to
// check itself or generate types. Available over both HTTP and WS; HTTP
// path is `/schema`.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import type { api_schema } from "../../types/schema";

export const get_schema_http = async (http: http_client): Promise<api_schema> =>
  http.get<api_schema>("/schema");

export const get_schema_ws = async (ws: ws_client): Promise<api_schema> =>
  ws.request<api_schema>("schema");
