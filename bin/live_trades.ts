#!/usr/bin/env bun
// =================================================
// live_trades — WebSocket subscription to trades.subscribe for one token.
// Streams trades newest-first as they hit the chain. Ctrl+C to exit.
//
// Examples:
//   bun run bin/live_trades.ts wrap.near
//   bun run bin/live_trades.ts wrap.near --history 5 --min_usd 100
//   bun run bin/live_trades.ts wrap.near --trader intents.near --side buy
// =================================================
import { intear_api, subscription_error } from "../src/index";
import { parse_args, fail } from "./_args";
import type { min_usd } from "../src/types/trade";

const USAGE = `
Usage: bun run bin/live_trades.ts <token> [options]

  --history <N>       Print the last N trades (1..200) as the snapshot, then live.
                      Default 0 (snapshot empty, only live).
  --side <s>          buy|sell|add_liquidity|remove_liquidity (optional)
  --min_usd <v>       one of 10|50|100|500|1000|5000|10000 (optional)
  --trader <account>  Filter by trader (optional)
  --silent            Don't print every live push; just count them
  --help              Show this message
`;
// =================================================
const SIDES = new Set(["buy", "sell", "add_liquidity", "remove_liquidity"]);
const MIN_USD_VALUES = new Set([10, 50, 100, 500, 1000, 5000, 10_000]);
// =================================================
async function main(): Promise<void> {
  const { positional, flags } = parse_args(process.argv.slice(2));
  if ("help" in flags || positional.length < 1) {
    console.log(USAGE);
    process.exit(positional.length < 1 ? 1 : 0);
  }
  const token = positional[0];
  if (token === undefined) {
    console.error("missing token");
    process.exit(1);
  }
  const history_flag = flags["history"];
  const history = typeof history_flag === "string" ? Number(history_flag) : 0;
  if (!Number.isInteger(history) || history < 0 || history > 200) {
    console.error("--history must be 0..200");
    process.exit(1);
  }
  const side_flag = flags["side"];
  const side = typeof side_flag === "string" ? side_flag : undefined;
  if (side !== undefined && !SIDES.has(side)) {
    console.error(`--side must be one of ${[...SIDES].join("|")}`);
    process.exit(1);
  }
  let min_usd_value: min_usd | undefined;
  const min_usd_flag = flags["min_usd"];
  if (typeof min_usd_flag === "string") {
    const n = Number(min_usd_flag);
    if (!MIN_USD_VALUES.has(n)) {
      console.error(`--min_usd must be one of ${[...MIN_USD_VALUES].join("|")}`);
      process.exit(1);
    }
    min_usd_value = n as min_usd;
  }
  const trader_flag = flags["trader"];
  const trader = typeof trader_flag === "string" ? trader_flag : undefined;
  const silent = "silent" in flags;

  const api = new intear_api();
  const sub = api.trades.subscribe({
    fields: ["id", "trader", "side", "amount", "usd_value", "timestamp_millis"] as never,
    token,
    history,
    ...(side !== undefined ? { side: side as never } : {}),
    ...(min_usd_value !== undefined ? { min_usd: min_usd_value } : {}),
    ...(trader !== undefined ? { trader } : {}),
  });

  let history_count = 0;
  let live_count = 0;
  let stopping = false;
  const close = async (): Promise<void> => {
    if (stopping) return;
    stopping = true;
    console.log("\nclosing subscription ...");
    try {
      await sub.close();
    } catch {
      /* ignore */
    }
    api.close();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  try {
    const snapshot = await sub.result;
    if (snapshot.rows.length > 0) {
      history_count = snapshot.rows.length;
      if (!silent) {
        const rows = snapshot.rows.map((r) => ({
          id: r[0],
          trader: r[1],
          side: r[2],
          amount: r[3] ?? "",
          usd_value: r[4] ?? "",
          time: new Date(Number(r[5])).toISOString().replace("T", " ").slice(0, 19),
        }));
        console.log(`\n--- history: ${snapshot.rows.length} trade(s) ---`);
        console.table(rows);
      } else {
        console.log(`history: ${snapshot.rows.length} trade(s)`);
      }
    }
    console.log(`\nstreaming live trades for ${token} (Ctrl+C to stop) ...\n`);
    for await (const push of sub) {
      live_count += push.rows.length;
      if (!silent) {
        const rows = push.rows.map((r) => ({
          id: r[0],
          trader: r[1],
          side: r[2],
          amount: r[3] ?? "",
          usd_value: r[4] ?? "",
          time: new Date(Number(r[5])).toISOString().replace("T", " ").slice(0, 19),
        }));
        console.log(`[push @ ${push.height}]`);
        console.table(rows);
        process.stdout.write("\n");
      } else if (live_count % 10 === 0) {
        console.log(`${live_count} live trades so far`);
      }
    }
  } catch (err) {
    if (err instanceof subscription_error) {
      console.error(`\nsubscription ended: ${err.message}`);
    } else {
      console.error("\nUnexpected error:", err);
    }
    await close();
    process.exit(1);
  }
}

main().catch(fail);
// =================================================
// copyright 2026 by sleet.near
