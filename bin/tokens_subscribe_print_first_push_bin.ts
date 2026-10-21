#!/usr/bin/env bun
// =================================================
// tokens_subscribe_print_first_push (live snapshot + one push)
//
// Opens a WebSocket subscription for two popular tokens
// (wrap.near / wNEAR and usdt.tether-token.near / USDt),
// prints the initial snapshot the server sends on subscribe,
// then waits for the first live push, prints it, and exits.
//
// The `min_change` threshold (`price_usd: "0.1%"`) tells the
// server to only push when a token's USD price moved at least
// that much, so a quiet market doesn't spam you.
//
// Run:
//   bun run bin/tokens_subscribe_print_first_push_bin.ts
//
// No CLI args, no env. Read-only; the subscription is closed
// as soon as the first push lands (or after TIMEOUT_MS, so the
// script always terminates even on a dead market).
// =================================================
import { IntearApi } from "../src/index";
import type { TokenPush } from "../src/types/token";
// =================================================
const TOKENS = ["wrap.near", "usdt.tether-token.near"];
// The API only accepts specific thresholds; "0.1%" is the closest
// documented value at or below a 5-tenths-of-a-percent move.
const MIN_CHANGE = { price_usd: "0.1%" } as const;
// Give up waiting for a push after this long so we never hang.
const TIMEOUT_MS = 60_000;

// Render the snapshot table (first push's `result`) as readable rows.
const print_snapshot = (res: {
  columns: readonly string[];
  rows: ReadonlyArray<readonly unknown[]>;
}): void => {
  console.log(`\nSnapshot columns: [${res.columns.join(", ")}]`);
  const as_objects = res.rows.map((r) => {
    const o: Record<string, unknown> = {};
    res.columns.forEach((c, i) => {
      o[c] = r[i];
    });
    return o;
  });
  if (as_objects.length === 0) {
    console.log("  (snapshot is empty)");
    return;
  }
  console.table(as_objects);
};
// =================================================
async function main(): Promise<void> {
  const api = new IntearApi();
  console.log(`Subscribing to ${TOKENS.join(", ")} (min_change price_usd=${MIN_CHANGE.price_usd}) ...`);

  const sub = api.tokens.subscribe({
    fields: ["symbol", "price_usd", "volume_usd_24h"],
    ids: TOKENS,
    min_change: MIN_CHANGE,
    snapshot: true,
  });

  // The initial snapshot arrives on the subscription's `result` promise.
  const snapshot = await sub.result;
  console.log("\n--- initial snapshot ---");
  print_snapshot(snapshot);

  console.log(`\nWaiting up to ${TIMEOUT_MS / 1000}s for the first live push ...`);

  // Race the async iterator against a timeout so we always terminate.
  const first_push = await Promise.race([
    (async () => {
      for await (const push of sub) return push;
      return null;
    })(),
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), TIMEOUT_MS),
    ),
  ]);

  if (first_push === null) {
    console.log("\nNo push within the timeout — market may be quiet. Closing.");
    await sub.close();
    api.close();
    return;
  }

  console.log("\n--- first live push ---");
  console.log(`height: ${first_push.height}  timestamp: ${new Date(first_push.timestamp_millis).toISOString()}`);
  const push = first_push as TokenPush<readonly ("symbol" | "price_usd" | "volume_usd_24h")[]>;
  const set_rows = Object.entries(push.set ?? {}).map(([token, fields]) => ({
    token,
    symbol: fields.symbol ?? "-",
    price_usd: fields.price_usd ?? "-",
    volume_usd_24h: fields.volume_usd_24h ?? "-",
  }));
  if (set_rows.length > 0) {
    console.table(set_rows);
  }
  if (push.created?.length) console.log(`created: ${push.created.join(", ")}`);
  if (push.left?.length) console.log(`left: ${push.left.join(", ")}`);

  await sub.close();
  api.close();
  console.log("\nDone (closed after first push).");
  // Exit explicitly: the for-await inside Promise.race may still be parked
  // on the WebSocket even after we resolve.
  process.exit(0);
}

main().catch((err) => {
  if (err && typeof err === "object" && "code" in err && "message" in err) {
    const e = err as { code: string; message: string };
    console.error(`\nSubscription error (code ${e.code}): ${e.message}`);
  } else {
    console.error("\nUnexpected error:", err);
  }
  process.exit(1);
});
// =================================================
// copyright 2026 by sleet.near