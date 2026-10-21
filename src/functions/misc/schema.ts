// =========================
// `schema` — the live API definition. Useful for tooling that wants to
// check itself or generate types. Available over both HTTP and WS; HTTP
// path is `/schema`.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import type { ApiSchema } from "../../types/schema";

export const get_schema_http = async (http: HttpClient): Promise<ApiSchema> =>
  http.get<ApiSchema>("/schema");

export const get_schema_ws = async (ws: WsClient): Promise<ApiSchema> =>
  ws.request<ApiSchema>("schema");
