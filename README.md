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
import { intear_api } from "@sleet-js/intear-api-tool-box";

const api = new intear_api();

// HTTP: one-shot query
const tokens = await api.tokens.get({
  fields: ["symbol", "price_usd", "volume_usd_24h"],
  where: { min_reputation: "NotFake" },
  sort: { by: "volume_usd_24h", desc: true },
  limit: 20,
});
for (const row of tokens.rows) {
  // row[0]: string        (account_id)
  // row[1]: string        (symbol)
  // row[2]: DECIMAL_STRING (price_usd)
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

| Property          | Endpoints                                          |
| ----------------- | -------------------------------------------------- |
| `api.tokens`      | `get`, `search`, `subscribe`, `update`             |
| `api.trades`      | `query`, `subscribe`                               |
| `api.transfers`   | `query`, `subscribe`                               |
| `api.activity`    | `query`, `subscribe`                               |
| `api.candles`     | `get`, `subscribe`                                 |
| `api.balances`    | `get`, `subscribe`                                 |
| `api.holders`     | `get`, `subscribe`                                 |
| `api.positions`   | `get`                                              |
| `api.accounts`    | `search`, `by_public_key`, `key_stats`             |
| `api.prices`      | `at`                                               |
| `api.misc`        | `cosmetics`, `schema`, `icon_url`, `table_to_objects` |

## Subscriptions

Every `.subscribe(...)` call returns a `subscription<t_push, t_result>` with:

- `sub.result: Promise<t_result | subscription_no_snapshot>` — resolves once, either with the initial snapshot or with a `subscription_no_snapshot` marker (when the server opened the stream without sending one — e.g. `trades.subscribe` with `history: 0`, or any filter that matches nothing). Always check before reading fields:
  ```ts
  const initial = await sub.result;
  if (initial instanceof subscription_no_snapshot) {
    /* no initial snapshot — the first push is the first thing you'll see */
  } else {
    for (const row of initial.rows) { /* ... */ }
  }
  ```
- async iterator — yields pushes forever until the server ends or you call `sub.close()`.
- `sub.close()` — sends `unsubscribe` and ends iteration.

The `token_subscription` (returned by `api.tokens.subscribe`) extends this with `update({ add, remove })` for adjusting a `tokens.subscribe` in place.

## Example scripts

The `bin/` directory has runnable CLI examples against the live API. See [`bin/README.md`](./bin/README.md).

```sh
bun run bin/token_info.ts wrap.near
bun run bin/top_tokens.ts --sort=-volume_usd_24h --limit 10
bun run bin/live_trades.ts wrap.near        # Ctrl+C to exit
```

## Unit tests

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
