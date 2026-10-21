// =========================
// `IntearApi` — the one class a consumer instantiates.
//
//   const api = new IntearApi();
//   const t = await api.tokens.get({ fields: ['symbol','price_usd'], ids: ['wrap.near'] });
//   for await (const push of api.tokens.subscribe({ fields: ['price_usd'], ids: ['wrap.near'] })) { … }
//
// Design:
//   * Owns one `HttpClient` and at most one `WsClient`. The WS client connects
//     lazily on the first `.subscribe(...)` call.
//   * HTTP endpoints go through the HttpClient. Subscription endpoints go
//     through the WS client. Errors are surfaced uniformly.
//   * The connection object is closed with `api.close()`.
// =========================

import { HttpClient } from "./http_client";
import { WsClient } from "./ws_client";
import type { HelloMessage } from "../types/common";

export interface IntearApiOptions {
  http_base_url?: string;
  ws_url?: string;
  fetch?: typeof fetch;
  websocket_impl?: typeof WebSocket;
  // Open the WS immediately instead of lazily on first .subscribe(...).
  open_ws?: boolean;
}

export class IntearApi {
  readonly http: HttpClient;
  readonly ws: WsClient;

  // Endpoint groups — each is built by a `bind_*(http, ws)` factory in
  // `functions/*` and assembled by `create_endpoints()` (see `./endpoints`).
  // Declared here so the whole public surface reads in one place; every
  // property is assigned in the constructor.
  readonly tokens: TokensEndpoints;
  readonly trades: TradesEndpoints;
  readonly transfers: TransfersEndpoints;
  readonly activity: ActivityEndpoints;
  readonly candles: CandlesEndpoints;
  readonly balances: BalancesEndpoints;
  readonly holders: HoldersEndpoints;
  readonly positions: PositionsEndpoints;
  readonly accounts: AccountsEndpoints;
  readonly prices: PricesEndpoints;
  readonly misc: MiscEndpoints;

  constructor(opts: IntearApiOptions = {}) {
    this.http = new HttpClient({
      base_url: opts.http_base_url,
      fetch: opts.fetch,
    });
    this.ws = new WsClient({
      url: opts.ws_url,
      websocket_impl: opts.websocket_impl,
    });
    if (opts.open_ws) void this.ws.hello;

    const endpoints = create_endpoints(this.http, this.ws);
    this.tokens = endpoints.tokens;
    this.trades = endpoints.trades;
    this.transfers = endpoints.transfers;
    this.activity = endpoints.activity;
    this.candles = endpoints.candles;
    this.balances = endpoints.balances;
    this.holders = endpoints.holders;
    this.positions = endpoints.positions;
    this.accounts = endpoints.accounts;
    this.prices = endpoints.prices;
    this.misc = endpoints.misc;
  }

  /** Wait for the server's `hello` (and thus the WS connection to open). */
  get hello(): Promise<HelloMessage> {
    return this.ws.hello;
  }

  /** Close the WebSocket and reject any in-flight requests. */
  close(): void {
    this.ws.close();
  }
}

// These are forward declarations of the endpoint-group shapes — they're
// filled in by the file below. Each `...Endpoints` interface names every
// method the corresponding endpoint group exposes on `IntearApi`.
import { create_endpoints } from "./endpoints";
import type {
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
} from "./endpoints";
