// =========================
// `intear_api` — the one class a consumer instantiates.
//
//   const api = new intear_api();
//   const t = await api.tokens.get({ fields: ['symbol','price_usd'], ids: ['wrap.near'] });
//   for await (const push of api.tokens.subscribe({ fields: ['price_usd'], ids: ['wrap.near'] })) { … }
//
// Design:
//   * Owns one `http_client` and at most one `ws_client`. The WS client connects
//     lazily on the first `.subscribe(...)` call.
//   * HTTP endpoints go through the http_client. Subscription endpoints go
//     through the WS client. Errors are surfaced uniformly.
//   * The connection object is closed with `api.close()`.
// =========================

import { http_client } from "./http_client";
import { ws_client } from "./ws_client";
import type { hello_message } from "../types/common";
import { console_logger } from "../helpers/logger";
import type { logger, log_level } from "../helpers/logger";

export interface intear_api_options {
  http_base_url?: string;
  ws_url?: string;
  fetch?: typeof fetch;
  websocket_impl?: typeof WebSocket;
  // Open the WS immediately instead of lazily on first .subscribe(...).
  open_ws?: boolean;
  // Diagnostic logging. `level` defaults to "none" (silent). Pass a
  // `logger` to redirect output to pino/winston/datadog/etc.; defaults
  // to a console-backed logger filtered by level.
  level?: log_level;
  logger?: logger;
}

export class intear_api {
  readonly http: http_client;
  readonly ws: ws_client;
  readonly level: log_level;
  readonly logger: logger;

  // Endpoint groups — each is built by a `bind_*(http, ws)` factory in
  // `functions/*` and assembled by `create_endpoints()` (see `./endpoints`).
  // Declared here so the whole public surface reads in one place; every
  // property is assigned in the constructor.
  readonly tokens: tokens_endpoints;
  readonly trades: trades_endpoints;
  readonly transfers: transfers_endpoints;
  readonly activity: activity_endpoints;
  readonly candles: candles_endpoints;
  readonly balances: balances_endpoints;
  readonly holders: holders_endpoints;
  readonly positions: positions_endpoints;
  readonly accounts: accounts_endpoints;
  readonly prices: prices_endpoints;
  readonly traders: traders_endpoints;
  readonly misc: misc_endpoints;

  constructor(opts: intear_api_options = {}) {
    this.level = opts.level ?? "none";
    this.logger = opts.logger ?? new console_logger(this.level);
    this.http = new http_client({
      base_url: opts.http_base_url,
      fetch: opts.fetch,
      logger: this.logger,
    });
    this.ws = new ws_client({
      url: opts.ws_url,
      websocket_impl: opts.websocket_impl,
      logger: this.logger,
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
    this.traders = endpoints.traders;
    this.misc = endpoints.misc;
  }

  /** Wait for the server's `hello` (and thus the WS connection to open). */
  get hello(): Promise<hello_message> {
    return this.ws.hello;
  }

  /** Close the WebSocket and reject any in-flight requests. */
  close(): void {
    this.ws.close();
  }
}

// These are forward declarations of the endpoint-group shapes — they're
// filled in by the file below. Each `...Endpoints` interface names every
// method the corresponding endpoint group exposes on `intear_api`.
import { create_endpoints } from "./endpoints";
import type {
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
  traders_endpoints,
  misc_endpoints,
} from "./endpoints";
