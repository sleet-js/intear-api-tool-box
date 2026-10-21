#!/usr/bin/env bun
// =================================================
// recent_trades — last N trades for a token via trades.query.
//
// Examples:
//   bun run bin/recent_trades.ts wrap.near --limit 10
//   bun run bin/recent_trades.ts wrap.near --limit 50 --side buy --min_usd 100
//   bun run bin/recent_trades.ts wrap.near --from now-1h
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, fail } from "./_args";
import type { min_usd, trades_query_response, trade_requested_field } from "../src/types/trade";

const USAGE = `
Usage: bun run bin/recent_trades.ts <token> [options]

  --limit <N>         1..200, default 25
  --side <s>          buy|sell|add_liquidity|remove_liquidity (optional)
  --min_usd <v>       one of 10|50|100|500|1000|5000|10000 (optional)
  --trader <account>  Filter by trader (optional)
  --from <now-Nm|h>   History since this long ago. e.g. --from now-2h, --from now-30m
                      Server expects an absolute timestamp; this is converted.
  --page <cursor>     Resume paging from a previous next_cursor (pairs with --raw)
  --raw               Show only <id, trader, side, amount, usd_value, timestamp> columns
                      (default shows those + token/counterparty)
  --help              Show this message
`;
// =================================================
const SIDES = new Set(["buy", "sell", "add_liquidity", "remove_liquidity"]);
const MIN_USD_VALUES = new Set([10, 50, 100, 500, 1000, 5000, 10_000]);

const parse_duration = (s: string): number | null => {
  const m = /^now-(\d+)([smhd])$/.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2];
  const ms = unit === "s"
    ? n * 1000
    : unit === "m"
    ? n * 60_000
    : unit === "h"
    ? n * 3_600_000
    : n * 86_400_000;
  return Date.now() - ms;
};
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
  const limit = Number(flags["limit"] ?? 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    console.error("--limit must be 1..200");
    process.exit(1);
  }
  const side_flag = flags["side"];
  const side = typeof side_flag === "string" ? side_flag : undefined;
  if (side !== undefined && !SIDES.has(side)) {
    console.error(`--side must be one of ${[...SIDES].join("|")}`);
    process.exit(1);
  }
  const min_usd_flag = flags["min_usd"];
  let min_usd_value: min_usd | undefined;
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
  let after_millis: number | undefined;
  const from_flag = flags["from"];
  if (typeof from_flag === "string") {
    const ts = parse_duration(from_flag);
    if (ts === null) {
      console.error("--from must look like now-Ns|now-Nm|now-Nh|now-Nd");
      process.exit(1);
    }
    after_millis = ts;
  }
  const raw = "raw" in flags;
  const cursor_flag = flags["page"];
  const cursor = typeof cursor_flag === "string" ? cursor_flag : undefined;

  // `id`, `height`, `timestamp_millis` are auto-included by the server.
const request_fields: readonly trade_requested_field[] = raw
    ? ["trader", "side", "amount", "usd_value"]
    : [
        "trader",
        "side",
        "amount",
        "usd_value",
        "token",
        "counterparty",
        "amount_in",
        "amount_out",
      ];
  type flexible_response = trades_query_response<readonly trade_requested_field[]>;

  const api = new intear_api();
  try {
    const res = (await api.trades.query({
      fields: request_fields,
      token,
      limit,
      ...(side !== undefined ? { side: side as never } : {}),
      ...(min_usd_value !== undefined ? { min_usd: min_usd_value } : {}),
      ...(trader !== undefined ? { trader } : {}),
      ...(after_millis !== undefined ? { after_millis } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
      order: "newest",
    })) as flexible_response;
    if (res.rows.length === 0) {
      console.log(`no trades for ${token}`);
      return;
    }
    const rows: Array<Record<string, unknown>> = [];
    const label_index: Record<string, number> = {};
    for (let i = 0; i < request_fields.length; i++) {
      const k = request_fields[i];
      if (k !== undefined) label_index[k] = i + 1;
    }
    // Auto-included server columns sit at the tail of each row.
    const ts_index = request_fields.length + 1;
    for (const row of res.rows) {
      const r: Record<string, unknown> = {};
      r["id"] = row[0];
      for (const [label, idx] of Object.entries(label_index)) {
        r[label] = idx < row.length ? row[idx] : null;
      }
      const ts = ts_index < row.length ? row[ts_index] : null;
      if (typeof ts === "number") {
        r["time"] = new Date(ts).toISOString().replace("T", " ").slice(0, 19);
      }
      rows.push(r);
    }
    console.log(`\n${res.rows.length} trade(s) for ${token}:`);
    console.table(rows);
  } catch (err) {
    if (err instanceof api_error) {
      console.error(`\nAPI error (HTTP ${err.status}, code ${err.code}): ${err.message}`);
    }
    fail(err);
  } finally {
    api.close();
  }
}

main().catch(fail);
// =================================================
// copyright 2026 by sleet.near
