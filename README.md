# @sleet-js/intear-api-tool-box

A typed TypeScript SDK for the [Intear API](https://docs.intear.tech/api/) at `https://api.intea.rs` (HTTP) and `wss://api.intea.rs/ws` (WebSocket).

- One client class, both transports.
- Strict types: each token / trade / transfer field has its own TS type. Passing `fields: ['symbol','price_usd']` narrows the returned row type accordingly.
- Subscriptions are `AsyncIterable`s with a `result` Promise for the first snapshot.

## Install

```sh
bun add @sleet-js/intear-api-tool-box
# or
npm install @sleet-js/intear-api-tool-box
```

## Usage

```ts
import { IntearApi } from "@sleet-js/intear-api-tool-box";

const api = new IntearApi();

// HTTP: one-shot query
const tokens = await api.tokens.get({
  fields: ["symbol", "price_usd", "volume_usd_24h"],
  where: { min_reputation: "NotFake" },
  sort: { by: "volume_usd_24h", desc: true },
  limit: 20,
});
for (const row of tokens.rows) {
  // row[0]: string (account_id)
  // row[1]: string (symbol)
  // row[2]: DecimalString (price_usd)
}

// WebSocket: live updates
const sub = api.tokens.subscribe({
  fields: ["price_usd", "volume_usd_24h"],
  ids: ["wrap.near"],
  min_change: { price_usd: "0.1%" },
});

for await (const push of sub) {
  for (const [token, fields] of Object.entries(push.set ?? {})) {
    console.log(token, fields);
  }
}
```

## Endpoint groups

| Property          | Endpoints                                     |
| ----------------- | --------------------------------------------- |
| `api.tokens`      | `get`, `search`, `subscribe`, `update`        |
| `api.trades`      | `query`, `subscribe`                          |
| `api.transfers`   | `query`, `subscribe`                          |
| `api.activity`    | `query`, `subscribe`                          |
| `api.candles`     | `get`, `subscribe`                            |
| `api.balances`    | `get`, `subscribe`                            |
| `api.holders`     | `get`, `subscribe`                            |
| `api.positions`   | `get`                                         |
| `api.accounts`    | `search`, `by_public_key`, `key_stats`        |
| `api.prices`      | `at`                                          |
| `api.misc`        | `cosmetics`, `schema`, `icon_url`, `table_to_objects` |

## Subscriptions

Every `.subscribe(...)` call returns a `Subscription<TPush, TResult>` with:

- `sub.result: Promise<TResult>` — resolves once with the initial snapshot.
- `async iterator` — yields pushes forever until the server ends or you call `sub.close()`.
- `sub.close()` — sends `unsubscribe` and ends iteration.

The `TokenSubscription` (returned by `api.tokens.subscribe`) extends this with `update({ add, remove })` for adjusting a `tokens.subscribe` in place.

## Tests / runtime checks against the live API

The Intear API is versioned, so this SDK's types are checked against the docs at `/api/llms-full.txt`. Live response shapes are validated against the docs as the docs change. If you find a shape mismatch, open an issue with the offending response.

## Bins

The repo ships with `bin/*.ts` scripts that exercise the SDK against the live API. They're not tests — they're inspection tools you run to verify the SDK works and to look at real on-chain data.

```sh
bun run overview          # tokens, candles, balances, positions, accounts, trades, holders
bun run tokens:print      # live tokens.subscribe: snapshot + first push
bun run trades:print      # live trades.subscribe: history + first live push
bun run schema            # full Intear API schema (method paths, thresholds, limits)
bun run icons             # top-3 tokens by 24h volume + their public icon URLs
```

Unit tests for the URL encoder live in `tests/`:

```sh
bun test
```

### DEV

to develop and publish this package
```bash
bun install
bun run typecheck
bun run build
bun publish --dry-run
bunx npm login
bun publish --access public
```
