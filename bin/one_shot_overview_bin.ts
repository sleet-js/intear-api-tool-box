#!/usr/bin/env bun
// =================================================
// one_shot_overview (quick read of every endpoint)
//
// One pass over the live Intear API that exercises the HTTP
// surface of the SDK: tokens, candles, balances, positions,
// account search, recent trades, and top holders for wNEAR.
// Prints a small, human-readable summary of each — useful as a
// smoke demo that the SDK talks to the real API.
//
// Run:
//   bun run bin/one_shot_overview_bin.ts
//
// No CLI args, no env. Everything is hardcoded to public data
// (a couple of well-known wNEAR holder accounts). Read-only —
// this script never writes anything.
// =================================================
import { IntearApi, ApiError } from "../src/index";
import type { SubscriptionError } from "../src/helpers/subscribe";
// =================================================
const WNEAR = "wrap.near";
// A couple of hardcoded, publicly known holder accounts to show
// balances and positions for. Replace with any account id.
const DEMO_ACCOUNT = "v2.ref-finance.near";
const SECOND_ACCOUNT = "intents.near";

const usd = (v: string | number | null | undefined, dp = 6): string => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("en-US", { maximumFractionDigits: dp });
};

const pct = (v: number | null | undefined): string =>
  v === null || v === undefined ? "-" : `${(v * 100).toFixed(2)}%`;

// Print a friendly section header.
const section = (title: string): void => {
  console.log(`\n${"=".repeat(60)}\n${title}\n${"=".repeat(60)}`);
};

async function tokens_overview(api: IntearApi): Promise<void> {
  section("tokens.get — wrap.near (wNEAR)");
  const res = await api.tokens.get({
    fields: ["symbol", "price_usd", "holders", "decimals", "volume_usd_24h"],
    ids: [WNEAR],
  });
  const row = res.rows[0];
  if (!row) {
    console.log("  no row returned for wrap.near");
    return;
  }
  const [, symbol, price_usd, holders, decimals, volume_usd_24h] = row;
  console.table([
    { field: "account_id", value: row[0] },
    { field: "symbol", value: symbol },
    { field: "price_usd", value: usd(price_usd, 6) },
    { field: "holders", value: String(holders) },
    { field: "decimals", value: String(decimals) },
    { field: "volume_usd_24h", value: `$${usd(volume_usd_24h, 2)}` },
  ]);
}

async function candles_overview(api: IntearApi): Promise<void> {
  section("candles.get — wrap.near @ 1h (last 3 closes)");
  const res = await api.candles.get({
    tokens: [WNEAR],
    resolution: "1h",
    series: ["close"],
    count_back: 3,
  });
  const data = res.tokens[WNEAR];
  const closes = data?.usd?.close ?? [];
  const times = data?.time ?? [];
  const rows = closes.map((c, i) => ({
    time: new Date(times[i] ?? 0).toISOString().replace("T", " ").slice(0, 16),
    close_usd: usd(c, 6),
  }));
  if (rows.length === 0) {
    console.log("  no candles returned");
    return;
  }
  console.table(rows);
}

async function balances_overview(api: IntearApi): Promise<void> {
  section("balances.get — demo accounts (top 5 non-zero holdings)");
  for (const account of [DEMO_ACCOUNT, SECOND_ACCOUNT]) {
    const res = await api.balances.get({
      account,
      sources: ["direct", "native", "rhea"],
    });
    // Cap output to the largest non-zero holdings for readability.
    const all = res.balances.rows
      .filter(([, , balance]) => BigInt(balance) > 0n)
      .slice(0, 5);
    const rows = all.map(([token, source, balance]) => ({
      account,
      token,
      source,
      balance: usd(balance, 4),
    }));
    console.log(`\n  ${account}:`);
    if (rows.length === 0) {
      console.log(`    (no positive balances — ${res.balances.rows.length} zero/empty rows)`);
      continue;
    }
    console.table(rows);
  }
}

async function positions_overview(api: IntearApi): Promise<void> {
  section("positions.get — demo accounts (cost basis)");
  for (const account of [DEMO_ACCOUNT, SECOND_ACCOUNT]) {
    const res = await api.positions.get({ account, limit: 5 });
    const rows = res.rows.map((r) => ({
      account,
      token: r[0],
      amount: usd(r[4], 4),
      cost_usd: usd(r[5], 2),
      realized_pnl_usd: usd(r[10], 2),
      buys: String(r[11]),
      sells: String(r[12]),
    }));
    console.log(`\n  ${account}:`);
    if (rows.length === 0) {
      console.log("    (no open positions)");
      continue;
    }
    console.table(rows);
  }
}

async function accounts_overview(api: IntearApi): Promise<void> {
  section('accounts.search — prefix "intear"');
  const res = await api.accounts.search({ prefix: "intear", limit: 10 });
  const rows = res.rows.map(([account_id, last_ms]) => ({
    account_id,
    last_transaction: last_ms === null ? "-" : new Date(last_ms).toISOString().replace("T", " ").slice(0, 19),
  }));
  if (rows.length === 0) {
    console.log("  no matching accounts");
    return;
  }
  console.table(rows);
}

async function trades_overview(api: IntearApi): Promise<void> {
  section("trades.query — wrap.near (last 3)");
  const res = await api.trades.query({
    fields: ["trader", "side", "amount", "usd_value"],
    token: WNEAR,
    limit: 3,
  });
  const rows = res.rows.map((r) => {
    const [id, trader, side, amount, usd_value] = r;
    return {
      id: String(id),
      trader,
      side,
      amount: usd(amount, 4),
      usd_value: usd_value === null ? "-" : `$${usd(usd_value, 2)}`,
    };
  });
  if (rows.length === 0) {
    console.log("  no trades returned");
    return;
  }
  console.table(rows);
}

async function holders_overview(api: IntearApi): Promise<void> {
  section("holders.get — wrap.near (top 5 by balance)");
  const res = await api.holders.get({ token: WNEAR, limit: 5 });
  const total_rows = res.total ?? res.rows.length;
  const total_balance = res.rows.reduce((acc, r) => acc + Number(r[1]), 0);
  const rows = res.rows.map(([account_id, balance], i) => ({
    rank: String(i + 1),
    account_id,
    balance: usd(balance, 0),
    share_of_top: total_balance > 0 ? pct(Number(balance) / total_balance) : "-",
  }));
  console.log(`  total holders on chain: ${total_rows}`);
  if (rows.length === 0) {
    console.log("  no holders returned");
    return;
  }
  console.table(rows);
}
// =================================================
async function main(): Promise<void> {
  const api = new IntearApi();
  console.log("Reading live Intear API (https://api.intea.rs) ...");
  await tokens_overview(api);
  await candles_overview(api);
  await balances_overview(api);
  await positions_overview(api);
  await accounts_overview(api);
  await trades_overview(api);
  await holders_overview(api);
  console.log("\nDone.");
  api.close();
  process.exit(0);
}

main().catch((err) => {
  if (err instanceof ApiError) {
    console.error(`\nAPI error (HTTP ${err.status}, code ${err.code}): ${err.message}`);
  } else if (err && typeof err === "object" && "code" in err) {
    const e = err as SubscriptionError;
    console.error(`\nSubscription error (code ${e.code}): ${e.message}`);
  } else {
    console.error("\nUnexpected error:", err);
  }
  process.exit(1);
});
// =================================================
// copyright 2026 by sleet.near