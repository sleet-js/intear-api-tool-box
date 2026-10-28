#!/usr/bin/env bun
// =================================================
// token_traders — a token's top traders by profit over a time range.
//
// Examples:
//   bun run bin/token_traders.ts token.intear.near
//   bun run bin/token_traders.ts token.intear.near --range 7d --top 20
// =================================================
import { intear_api, api_error, TRADER_RANGES } from "../src/index";
import type { trader_range } from "../src/index";
import { parse_args, fail } from "./_args";

const USAGE = `
Usage: bun run bin/token_traders.ts <token> [options]

  --range <24h|7d|30d|all>  Time the PnL is over (default: 24h)
  --top <N>                  1..100, default 100
  --help                     Show this message
`;
// =================================================
const is_range = (s: string): s is trader_range =>
  (TRADER_RANGES as readonly string[]).includes(s);

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

  const range_raw = typeof flags["range"] === "string" ? flags["range"] : "24h";
  if (!is_range(range_raw)) {
    console.error(`--range must be one of ${TRADER_RANGES.join(", ")}`);
    process.exit(1);
  }
  const range = range_raw;

  const top_raw = typeof flags["top"] === "string" ? flags["top"] : "100";
  const top = Number(top_raw);
  if (!Number.isInteger(top) || top < 1 || top > 100) {
    console.error("--top must be 1..100");
    process.exit(1);
  }

  const api = new intear_api();
  try {
    const res = await api.traders.get({ token, range, top });
    if (res.rows.length === 0) {
      console.log(`no traders returned for ${token}`);
      return;
    }
    console.log(`\ntop ${res.rows.length} trader(s) for ${token} over ${range}:`);
    const rows = res.rows.map((r, i) => ({
      rank: i + 1,
      account_id: r[0],
      pnl_usd: r[1],
      realized_pnl_usd: r[2],
      unrealized_pnl_usd: r[3],
      bought_usd: r[4],
      sold_usd: r[5],
      buys: r[6],
      sells: r[7],
      held: String(r[8]),
    }));
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
