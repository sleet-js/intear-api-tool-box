// =========================
// `bind_transfers(http, ws)` — assembles the `transfers` endpoint group.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { query_transfers } from "./query_transfers";
import { subscribe_transfers } from "./subscribe_transfers";
import type {
  TransferRequestedField,
  TransfersQueryParams,
  TransfersQueryResponse,
  TransfersSubscribeParams,
  TransfersSubscribeResponse,
  TransferPush,
} from "../../types/transfer";
import type { Subscription } from "../../helpers/subscribe";

export interface TransfersEndpoints {
  query: <F extends readonly TransferRequestedField[]>(
    params: TransfersQueryParams<F>,
  ) => Promise<TransfersQueryResponse<F>>;
  subscribe: <F extends readonly TransferRequestedField[]>(
    params: TransfersSubscribeParams<F>,
  ) => Subscription<TransferPush<F>, TransfersSubscribeResponse<F>>;
}

export const bind_transfers = (http: HttpClient, ws: WsClient): TransfersEndpoints => ({
  query: <F extends readonly TransferRequestedField[]>(
    params: TransfersQueryParams<F>,
  ) => query_transfers(http, params),
  subscribe: <F extends readonly TransferRequestedField[]>(
    params: TransfersSubscribeParams<F>,
  ) => subscribe_transfers(ws, params),
});
