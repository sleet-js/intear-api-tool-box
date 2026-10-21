// =========================
// Intear API client SDK — public surface.
//
// Usage:
//   import { IntearApi } from "@sleet-js/intear-api-tool-box";
//   const api = new IntearApi();
//   const wrapNear = await api.tokens.get({
//     fields: ["symbol", "price_usd"],
//     ids: ["wrap.near"],
//   });
//
// All endpoints have HTTP and (where applicable) WebSocket forms; the SDK
// uses HTTP for one-shot answers and the WebSocket for `.subscribe(...)`.
// Both transports are managed by a single `IntearApi` instance.
// =========================

export { IntearApi } from "./client/api";
export type { IntearApiOptions } from "./client/api";

export { HttpClient, ApiError, DEFAULT_BASE_URL } from "./client/http_client";
export { WsClient, DEFAULT_WS_URL } from "./client/ws_client";

// Endpoint groups are accessible as named exports too, so callers can grab
// a single group without instantiating the whole orchestrator.
export type { TokensEndpoints } from "./functions/tokens/bind_tokens";
export type { TradesEndpoints } from "./functions/trades/bind_trades";
export type { TransfersEndpoints } from "./functions/transfers/bind_transfers";
export type { ActivityEndpoints } from "./functions/activity/bind_activity";
export type { CandlesEndpoints } from "./functions/candles/bind_candles";
export type { BalancesEndpoints } from "./functions/balances/bind_balances";
export type { HoldersEndpoints } from "./functions/holders/bind_holders";
export type { PositionsEndpoints } from "./functions/positions/bind_positions";
export type { AccountsEndpoints } from "./functions/accounts/bind_accounts";
export type { PricesEndpoints } from "./functions/prices/bind_prices";
export type { MiscEndpoints } from "./functions/misc/bind_misc";

// Subscription shape used by every `.subscribe(...)` method.
export type {
  Subscription,
  TokenSubscription,
} from "./helpers/subscribe";

// Types — re-export so consumers don't have to dig by path.
export type {
  DecimalString,
  AccountId,
  IconHash,
} from "./helpers/brand";

// Brand coersions (runtime helpers, no cost).
export {
  as_decimal_string,
  as_account_id,
  as_icon_hash,
} from "./helpers/brand";

export type {
  ServerError,
  Limits,
  HelloMessage,
  IdleMessage,
  Table,
  PushEnvelopeBase,
  Reputation,
  MinChangeThreshold,
  MinIntervalMs,
  Precision,
} from "./types/common";

// Runtime constants — values the server accepts and our guards accept.
export {
  REPUTATIONS,
  is_reputation,
  MIN_CHANGE_THRESHOLDS,
  MIN_INTERVAL_MS_VALUES,
  PRECISION_RANGE,
  assert_precision,
  assert_min_interval_ms,
} from "./types/common";

export type {
  TokenField,
  TokenRequestedField,
  TokenValueByField,
  TokenRow,
  TokenWhere,
  TokenSort,
  TokenMinChange,
  TokensGetParams,
  TokensGetResponse,
  TokensSearchParams,
  TokensSearchResponse,
  TokensSubscribeParams,
  TokensSubscribeResponse,
  TokenPush,
  TokensUpdateResponse,
  SubscriptionUpdateParams,
} from "./types/token";

export type {
  TradeField,
  TradeRequestedField,
  TradeValueByField,
  TradeRow,
  TradeSide,
  MinUsd,
  TradesFilters,
  TradesOrder,
  TradesQueryParams,
  TradesQueryResponse,
  TradesSubscribeParams,
  TradesSubscribeResponse,
  TradePush,
} from "./types/trade";

export {
  TRADE_SIDES,
  is_trade_side,
  MIN_USD_VALUES,
} from "./types/trade";

export type {
  TransferKind,
  TransferField,
  TransferRequestedField,
  TransferValueByField,
  TransferRow,
  TransfersFilters,
  TransfersOrder,
  TransfersQueryParams,
  TransfersQueryResponse,
  TransfersSubscribeParams,
  TransfersSubscribeResponse,
  TransferPush,
} from "./types/transfer";

export type {
  ActivityKind,
  TransactionRequestedField,
  ActivityFields,
  ActivityParams,
  ActivityOrder,
  ActivityQueryParams,
  ActivityColumns,
  ActivityRow,
  ActivityResponse,
  ActivitySubscribeParams,
  ActivitySubscribeResponse,
  ActivityPush,
} from "./types/activity";

export type {
  CandleResolution,
  CandleSeriesField,
  CandleSeries,
  CandleQuote,
  CandleSeriesData,
  CandleTokenData,
  CandlesGetParams,
  CandlesSubscribeParams,
  CandlesResponse,
  CandlesSubscribeResponse,
  CandlePush,
} from "./types/candle";

export type {
  BalanceSource,
  BalanceRow,
  BalanceTable,
  BalancesGetParams,
  BalancesGetResponse,
  BalancesSubscribeParams,
  BalancesSubscribeResponse,
  BalancePush,
} from "./types/balance";

export { BALANCE_SOURCES } from "./types/balance";

export type {
  HolderRow,
  HoldersTable,
  HoldersGetParams,
  HoldersGetResponse,
  HoldersSubscribeParams,
  HoldersSubscribeResponse,
  HoldersPush,
} from "./types/holder";

export type {
  PositionRow,
  PositionsColumns,
  PositionsGetParams,
  PositionsResponse,
} from "./types/position";

export type {
  AccountRow,
  AccountsSearchParams,
  AccountsSearchResponse,
  AccountsByPublicKeyResponse,
  KeyStatsResponse,
} from "./types/account";

export type {
  PricesAtQuery,
  PricesAtParams,
  PricesAtResponse,
  ApiSchema,
  CosmeticsResponse,
  CosmeticReferrer,
  CosmeticUser,
} from "./types/schema";

export { table_to_objects } from "./functions/misc/table_helpers";
