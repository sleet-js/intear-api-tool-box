#!/usr/bin/env bun
// =================================================
// account_positions — open and closed cost-basis positions built from an
// account's swap history. The first position table from the SDK.
//
// Examples:
//   bun run bin/account_positions.ts intents.near
//   bun run bin/account_positions.ts intents.near --limit 50 --raw
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, fail } from "./_args";

const USAGE = `
Usage: bun run bin/account_positions.ts <account> [options]

  --limit <N>    1..1000, default 100
  --open         Only show positions that aren't closed yet
  --raw          Show the raw row columns instead of a friendly view
  --help         Show this message

Default columns shown: token, opened_at, closed_at, amount, cost_usd,
realized_pnl_usd, buys, sells.
`;
// =================================================
async function main(): Promise<void> {
  const { positional, flags } = parse_args(process.argv.slice(2));
  if ("help" in flags || positional.length < 1) {
    console.log(USAGE);
    process.exit(positional.length < 1 ? 1 : 0);
  }
  const account = positional[0];
  if (account === undefined) {
    console.error("missing account");
    process.exit(1);
  }
  const limit = Number(flags["limit"] ?? 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    console.error("--limit must be 1..1000");
    process.exit(1);
  }
  const only_open = "open" in flags;
  const raw = "raw" in flags;

  const api = new intear_api();
  try {
    const res = await api.positions.get({ account, limit });
    if (res.rows.length === 0) {
      console.log(`${account} has no positions`);
      return;
    }
    let rows = res.rows;
    if (only_open) {
      rows = rows.filter((r) => r[2] === null);
      if (rows.length === 0) {
        console.log(`${account} has no open positions`);
        return;
      }
    }
    if (raw) {
      const out = rows.map((r) => ({
        token: r[0],
        opened_at_millis: r[1],
        closed_at_millis: r[2],
        last_trade_millis: r[3],
        amount: r[4],
        cost_usd: r[5],
        bought: r[6],
        bought_usd: r[7],
        sold: r[8],
        sold_usd: r[9],
        realized_pnl_usd: r[10],
        buys: r[11],
        sells: r[12],
      }));
      console.log(`\npositions for ${account}:`);
      console.table(out);
    } else {
      const opened_fmt = (n: number | null): string =>
        n === null ? "-" : new Date(n).toISOString().slice(0, 10);
      const amount_fmt = (s: string): string =>
        Number(BigInt(s)).toLocaleString("en-US");
      const usd_fmt = (n: number): string =>
        n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
      const out = rows.map((r) => ({
        token: r[0],
        opened: opened_fmt(r[1]),
        closed: opened_fmt(r[2]),
        amount: amount_fmt(String(r[4])),
        cost_usd: usd_fmt(r[5]),
        realized_pnl_usd: usd_fmt(r[10]),
        buys: String(r[11]),
        sells: String(r[12]),
      }));
      console.log(`\n${account}: ${rows.length} position(s) (since ${new Date(Number(res.since_millis ?? 0)).toISOString().slice(0, 10)})`);
      console.table(out);
    }
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
