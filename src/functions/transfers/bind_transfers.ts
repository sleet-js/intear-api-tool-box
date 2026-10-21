// =========================
// `bind_transfers(http, ws)` — assembles the `transfers` endpoint group.
// =========================

import type { http_client } from "../../client/http_client";
import type { ws_client } from "../../client/ws_client";
import { query_transfers } from "./query_transfers";
import { subscribe_transfers } from "./subscribe_transfers";
import type {
  transfer_requested_field,
  transfers_query_params,
  transfers_query_response,
  transfers_subscribe_params,
  transfers_subscribe_response,
  transfer_push,
} from "../../types/transfer";
import type { subscription } from "../../helpers/subscribe";

export interface transfers_endpoints {
  query: <f extends readonly transfer_requested_field[]>(
    params: transfers_query_params<f>,
  ) => Promise<transfers_query_response<f>>;
  subscribe: <f extends readonly transfer_requested_field[]>(
    params: transfers_subscribe_params<f>,
  ) => subscription<transfer_push<f>, transfers_subscribe_response<f>>;
}

export const bind_transfers = (http: http_client, ws: ws_client): transfers_endpoints => ({
  query: <f extends readonly transfer_requested_field[]>(
    params: transfers_query_params<f>,
  ) => query_transfers(http, params),
  subscribe: <f extends readonly transfer_requested_field[]>(
    params: transfers_subscribe_params<f>,
  ) => subscribe_transfers(ws, params),
});
