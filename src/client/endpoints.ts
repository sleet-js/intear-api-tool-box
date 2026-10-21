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

import type { http_client } from "./http_client";
import type { ws_client } from "./ws_client";

import { bind_tokens, type tokens_endpoints } from "../functions/tokens/bind_tokens";
import { bind_trades, type trades_endpoints } from "../functions/trades/bind_trades";
import {
  bind_transfers,
  type transfers_endpoints,
} from "../functions/transfers/bind_transfers";
import {
  bind_activity,
  type activity_endpoints,
} from "../functions/activity/bind_activity";
import {
  bind_candles,
  type candles_endpoints,
} from "../functions/candles/bind_candles";
import {
  bind_balances,
  type balances_endpoints,
} from "../functions/balances/bind_balances";
import {
  bind_holders,
  type holders_endpoints,
} from "../functions/holders/bind_holders";
import {
  bind_positions,
  type positions_endpoints,
} from "../functions/positions/bind_positions";
import {
  bind_accounts,
  type accounts_endpoints,
} from "../functions/accounts/bind_accounts";
import { bind_prices, type prices_endpoints } from "../functions/prices/bind_prices";
import { bind_misc, type misc_endpoints } from "../functions/misc/bind_misc";

export type {
  tokens_endpoints,
  trades_endpoints,
  transfers_endpoints,
  activity_endpoints,
  candles_endpoints,
  balances_endpoints,
  holders_endpoints,
  positions_endpoints,
  accounts_endpoints,
  prices_endpoints,
  misc_endpoints,
};

export const create_endpoints = (
  http: http_client,
  ws: ws_client,
): {
  tokens: tokens_endpoints;
  trades: trades_endpoints;
  transfers: transfers_endpoints;
  activity: activity_endpoints;
  candles: candles_endpoints;
  balances: balances_endpoints;
  holders: holders_endpoints;
  positions: positions_endpoints;
  accounts: accounts_endpoints;
  prices: prices_endpoints;
  misc: misc_endpoints;
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
