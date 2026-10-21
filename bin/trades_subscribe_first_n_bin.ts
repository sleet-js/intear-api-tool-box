#!/usr/bin/env bun
// =================================================
// trades_subscribe_print_first_n (history then one live push)
//
// Subscribes to wrap.near (wNEAR) trades over the WebSocket.
// The `history: 5` option makes the server replay the 5 most
// recent trades in the initial snapshot; this script prints those
// as a table, then waits for the very first live push (new trades
// arriving after the snapshot), prints it, and exits.
//
// Run:
//   bun run bin/trades_subscribe_first_n_bin.ts
//
// No CLI args, no env. Read-only. The subscription closes after
// the first live push, or after TIMEOUT_MS if the market is quiet,
// so the script always terminates.
// =================================================
import { IntearApi } from "../src/index";
import type { TradePush } from "../src/types/trade";
// =================================================
const TOKEN = "wrap.near";
const HISTORY = 5;
// Give up waiting for a push after this long so we never hang.
const TIMEOUT_MS = 60_000;

const TRADE_FIELDS = ["trader", "side", "amount", "usd_value"] as const;

const fmt = (v: string | number | null | undefined, dp = 6): string => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("en-US", { maximumFractionDigits: dp });
};

// Turn a `[id, ...fields]` row into a readable object keyed by column.
const row_to_object = (columns: readonly string[], row: readonly unknown[]): Record<string, unknown> => {
  const o: Record<string, unknown> = {};
  columns.forEach((c, i) => {
    o[c] = row[i];
  });
  return o;
};
// =================================================
async function main(): Promise<void> {
  const api = new IntearApi();
  console.log(`Subscribing to ${TOKEN} trades (history: ${HISTORY}) ...`);

  const sub = api.trades.subscribe({
    fields: TRADE_FIELDS,
    token: TOKEN,
    history: HISTORY,
  });

  // The initial snapshot (history replay) arrives on `result`.
  const snapshot = await sub.result;
  console.log(`\n--- history (${snapshot.rows.length} of last ${HISTORY}) ---`);
  console.log(`columns: [${snapshot.columns.join(", ")}]`);
  if (snapshot.rows.length === 0) {
    console.log("  (no recent trades)");
  } else {
    console.table(snapshot.rows.map((r) => {
      const o = row_to_object(snapshot.columns, r);
      return {
        id: o["id"],
        trader: o["trader"],
        side: o["side"],
        amount: fmt(o["amount"] as string),
        usd_value: o["usd_value"] === null ? "-" : `$${fmt(o["usd_value"] as string, 2)}`,
      };
    }));
  }

  console.log(`\nWaiting up to ${TIMEOUT_MS / 1000}s for the first live trade push ...`);

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
    console.log("\nNo live push within the timeout — market may be quiet. Closing.");
    await sub.close();
    api.close();
    return;
  }

  console.log("\n--- first live push ---");
  const push = first_push as TradePush<typeof TRADE_FIELDS>;
  console.log(`height: ${push.height}  timestamp: ${new Date(push.timestamp_millis).toISOString()}`);
  if (push.rows.length === 0) {
    console.log("  (push carried no trades)");
  } else {
    console.table(push.rows.map((r) => {
      const [id, trader, side, amount, usd_value] = r;
      return {
        id: String(id),
        trader,
        side,
        amount: fmt(amount),
        usd_value: usd_value === null ? "-" : `$${fmt(usd_value, 2)}`,
      };
    }));
  }

  await sub.close();
  api.close();
  console.log("\nDone (closed after first push).");
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