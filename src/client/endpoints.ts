// =========================
// `endpoints.ts` — declares the per-endpoint interfaces (method shapes) and
// owns the `create_endpoints()` factory that wires each `functions/*` module
// to the orchestrator's HTTP and WS clients.
//
// Each endpoint module exports a single `bindX(http, ws)` function returning
// the corresponding endpoints object. `create_endpoints()` is the only place
// that knows about all of them — the rest of the SDK can import individual
// endpoint modules without coupling.
// =========================

import type { HttpClient } from "./http_client";
import type { WsClient } from "./ws_client";

import { bind_tokens, type TokensEndpoints } from "../functions/tokens/bind_tokens";
import { bind_trades, type TradesEndpoints } from "../functions/trades/bind_trades";
import {
  bind_transfers,
  type TransfersEndpoints,
} from "../functions/transfers/bind_transfers";
import {
  bind_activity,
  type ActivityEndpoints,
} from "../functions/activity/bind_activity";
import {
  bind_candles,
  type CandlesEndpoints,
} from "../functions/candles/bind_candles";
import {
  bind_balances,
  type BalancesEndpoints,
} from "../functions/balances/bind_balances";
import {
  bind_holders,
  type HoldersEndpoints,
} from "../functions/holders/bind_holders";
import {
  bind_positions,
  type PositionsEndpoints,
} from "../functions/positions/bind_positions";
import {
  bind_accounts,
  type AccountsEndpoints,
} from "../functions/accounts/bind_accounts";
import { bind_prices, type PricesEndpoints } from "../functions/prices/bind_prices";
import { bind_misc, type MiscEndpoints } from "../functions/misc/bind_misc";

export type {
  TokensEndpoints,
  TradesEndpoints,
  TransfersEndpoints,
  ActivityEndpoints,
  CandlesEndpoints,
  BalancesEndpoints,
  HoldersEndpoints,
  PositionsEndpoints,
  AccountsEndpoints,
  PricesEndpoints,
  MiscEndpoints,
};

export const create_endpoints = (
  http: HttpClient,
  ws: WsClient,
): {
  tokens: TokensEndpoints;
  trades: TradesEndpoints;
  transfers: TransfersEndpoints;
  activity: ActivityEndpoints;
  candles: CandlesEndpoints;
  balances: BalancesEndpoints;
  holders: HoldersEndpoints;
  positions: PositionsEndpoints;
  accounts: AccountsEndpoints;
  prices: PricesEndpoints;
  misc: MiscEndpoints;
} => ({
  tokens: bind_tokens(http, ws),
  trades: bind_trades(http, ws),
  transfers: bind_transfers(http, ws),
  activity: bind_activity(http, ws),
  candles: bind_candles(http, ws),
  balances: bind_balances(http, ws),
  holders: bind_holders(http, ws),
  positions: bind_positions(http, ws),
  accounts: bind_accounts(http, ws),
  prices: bind_prices(http),
  misc: bind_misc(http, ws),
});
