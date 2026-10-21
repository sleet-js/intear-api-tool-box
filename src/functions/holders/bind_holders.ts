// =========================
// `bind_holders(http, ws)` — assembles the `holders` endpoint group.
// =========================

import type { HttpClient } from "../../client/http_client";
import type { WsClient } from "../../client/ws_client";
import { get_holders } from "./get_holders";
import { subscribe_holders } from "./subscribe_holders";
import type {
  HoldersGetParams,
  HoldersGetResponse,
  HoldersSubscribeParams,
  HoldersSubscribeResponse,
  HoldersPush,
} from "../../types/holder";
import type { Subscription } from "../../helpers/subscribe";

export interface HoldersEndpoints {
  get: (params: HoldersGetParams) => Promise<HoldersGetResponse>;
  subscribe: (
    params: HoldersSubscribeParams,
  ) => Subscription<HoldersPush, HoldersSubscribeResponse>;
}

export const bind_holders = (http: HttpClient, ws: WsClient): HoldersEndpoints => ({
  get: (params) => get_holders(http, params),
  subscribe: (params) => subscribe_holders(ws, params),
});
