# bin/

Runnable example uses of `@sleet-js/intear-api-tool-box`. Each script is a
self-contained CLI against the live Intear API at `https://api.intea.rs` —
they're examples you can copy from, not tests.

```bash
bun run bin/token_info.ts wrap.near
bun run bin/top_tokens.ts --sort=-volume_usd_24h --limit 10
bun run bin/find_token.ts wrap
bun run bin/token_icon.ts wrap.near > icon_url.txt
bun run bin/candles.ts wrap.near --resolution 1h --count_back 24
bun run bin/recent_trades.ts wrap.near --limit 10 --min_usd 100
bun run bin/live_trades.ts wrap.near           # Ctrl+C to exit
bun run bin/live_tokens.ts wrap.near usdt.tether-token.near --min_change price_usd=0.1%
bun run bin/token_holders.ts wrap.near --limit 20
bun run bin/account_balances.ts v2.ref-finance.near
bun run bin/account_activity.ts intents.near --kinds trade,transfer
bun run bin/account_positions.ts intents.near
bun run bin/token_traders.ts token.intear.near --range 24h --top 10
```

Every script accepts `--help` for usage.

## What's in here

| script                    | what it shows                                      |
| ------------------------- | -------------------------------------------------- |
| `token_info.ts`           | name, symbol, price, supply, holders, socials      |
| `top_tokens.ts`           | top-N tokens by a sortable field                   |
| `find_token.ts`           | tokens.search by name / symbol / account id        |
| `token_icon.ts`           | public icon URL (cacheable WebP)                   |
| `candles.ts`              | last N candles for a token, optional CSV output    |
| `recent_trades.ts`        | recent trades (filterable by side / min USD)       |
| `live_trades.ts`          | WebSocket trade stream for a token                 |
| `live_tokens.ts`          | WebSocket token field updates with `min_change`    |
| `token_holders.ts`        | top token holders, including live mode             |
| `account_balances.ts`     | direct + native + Rhea balances for an account     |
| `account_activity.ts`     | recent trades / transfers / transactions for acct  |
| `account_positions.ts`    | open + closed positions with realised PnL          |
| `token_traders.ts`        | a token's top traders by PnL over a time range     |

## Conventions

- Every bin accepts CLI args via small positional / `--flag value` /
  `--flag=value` conventions (see `bin/_args.ts`).
- Every bin is one `#!/usr/bin/env bun` script with the standard header.
- They talk to the live API; no mocks.
- They print human-readable output with `console.table`. Some support
  `--csv` for machine-readable output.
- They exit 0 on success, 1 on API errors.
