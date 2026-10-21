// =========================
// Intear API client SDK — public surface.
//
// Usage:
//   import { intear_api } from "@sleet-js/intear-api-tool-box";
//   const api = new intear_api();
//   const wrapNear = await api.tokens.get({
//     fields: ["symbol", "price_usd"],
//     ids: ["wrap.near"],
//   });
//
// All endpoints have HTTP and (where applicable) WebSocket forms; the SDK
// uses HTTP for one-shot answers and the WebSocket for `.subscribe(...)`.
// Both transports are managed by a single `intear_api` instance.
// =========================

export { intear_api } from "./client/api";
export type { intear_api_options } from "./client/api";

export { http_client, api_error, DEFAULT_BASE_URL } from "./client/http_client";
export { ws_client, DEFAULT_WS_URL } from "./client/ws_client";

// Endpoint groups are accessible as named exports too, so callers can grab
// a single group without instantiating the whole orchestrator.
export type { tokens_endpoints } from "./functions/tokens/bind_tokens";
export type { trades_endpoints } from "./functions/trades/bind_trades";
export type { transfers_endpoints } from "./functions/transfers/bind_transfers";
export type { activity_endpoints } from "./functions/activity/bind_activity";
export type { candles_endpoints } from "./functions/candles/bind_candles";
export type { balances_endpoints } from "./functions/balances/bind_balances";
export type { holders_endpoints } from "./functions/holders/bind_holders";
export type { positions_endpoints } from "./functions/positions/bind_positions";
export type { accounts_endpoints } from "./functions/accounts/bind_accounts";
export type { prices_endpoints } from "./functions/prices/bind_prices";
export type { misc_endpoints } from "./functions/misc/bind_misc";

// Subscription shape used by every `.subscribe(...)` method.
export type {
  subscription,
  token_subscription,
} from "./helpers/subscribe";

// Thrown when a subscription ends (server-initiated `end` event).
export { subscription_error } from "./helpers/subscribe";

// Resolved into `sub.result` when the server opens a subscription without
// sending an initial snapshot. Check for it with `instanceof`.
export { subscription_no_snapshot } from "./helpers/subscribe";

// Branded primitives — types in SCREAMING_SNAKE_CASE.
export type {
  DECIMAL_STRING,
  ACCOUNT_ID,
  ICON_HASH,
} from "./helpers/brand";

// Brand coersions (runtime helpers, no cost).
export {
  as_decimal_string,
  as_account_id,
  as_icon_hash,
} from "./helpers/brand";

export type {
  server_error,
  limits,
  hello_message,
  idle_message,
  table,
  push_envelope_base,
  reputation,
  min_change_threshold,
  min_interval_ms,
  precision,
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
  token_field,
  token_requested_field,
  token_value_by_field,
  token_row,
  token_where,
  token_sort,
  token_min_change,
  tokens_get_params,
  tokens_get_response,
  tokens_search_params,
  tokens_search_response,
  tokens_subscribe_params,
  tokens_subscribe_response,
  token_push,
  tokens_update_response,
  subscription_update_params,
} from "./types/token";

export type {
  trade_field,
  trade_requested_field,
  trade_value_by_field,
  trade_row,
  trade_side,
  min_usd,
  trades_filters,
  trades_order,
  trades_query_params,
  trades_query_response,
  trades_subscribe_params,
  trades_subscribe_response,
  trade_push,
} from "./types/trade";

export {
  TRADE_SIDES,
  is_trade_side,
  MIN_USD_VALUES,
} from "./types/trade";

export type {
  transfer_kind,
  transfer_field,
  transfer_requested_field,
  transfer_value_by_field,
  transfer_row,
  transfers_filters,
  transfers_order,
  transfers_query_params,
  transfers_query_response,
  transfers_subscribe_params,
  transfers_subscribe_response,
  transfer_push,
} from "./types/transfer";

export type {
  activity_kind,
  transaction_requested_field,
  activity_fields,
  activity_params,
  activity_order,
  activity_query_params,
  activity_columns,
  activity_row,
  activity_response,
  activity_subscribe_params,
  activity_subscribe_response,
  activity_push,
} from "./types/activity";

export type {
  candle_resolution,
  candle_series_field,
  candle_series,
  candle_quote,
  candle_series_data,
  candle_token_data,
  candles_get_params,
  candles_subscribe_params,
  candles_response,
  candles_subscribe_response,
  candle_push,
} from "./types/candle";

export type {
  balance_source,
  balance_row,
  balance_table,
  balances_get_params,
  balances_get_response,
  balances_subscribe_params,
  balances_subscribe_response,
  balance_push,
} from "./types/balance";

export { BALANCE_SOURCES } from "./types/balance";

export type {
  holder_row,
  holders_table,
  holders_get_params,
  holders_get_response,
  holders_subscribe_params,
  holders_subscribe_response,
  holders_push,
} from "./types/holder";

export type {
  position_row,
  positions_columns,
  positions_get_params,
  positions_response,
} from "./types/position";

export type {
  account_row,
  accounts_search_params,
  accounts_search_response,
  accounts_by_public_key_response,
  key_stats_response,
} from "./types/account";

export type {
  prices_at_query,
  prices_at_params,
  prices_at_response,
  api_schema,
  cosmetics_response,
  cosmetic_referrer,
  cosmetic_user,
} from "./types/schema";

export { table_to_objects } from "./functions/misc/table_helpers";
