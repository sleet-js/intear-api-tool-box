#!/usr/bin/env bun
// =================================================
// account_activity — recent trades, transfers, and transactions for an
// account (single combined feed, newest first).
//
// Examples:
//   bun run bin/account_activity.ts intents.near --kinds trade,transfer --limit 10
//   bun run bin/account_activity.ts v2.ref-finance.near --kinds transaction --limit 5
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, csv, fail } from "./_args";

const USAGE = `
Usage: bun run bin/account_activity.ts <account> [options]

  --kinds <a,b,c>     trade|transfer|transaction (default all three)
  --limit <N>         1..200, default 25
  --from <now-Ns|...> Limit to entries newer than this duration, e.g. now-2h
  --token <token>     Only trades and transfers involving this token (optional)
  --help              Show this message

Trade row:           id, timestamp_millis, side, trader, amount, usd_value
Transfer row:        id, timestamp_millis, kind, sender, receiver, amount, token
Transaction row:     id, timestamp_millis, sender, receiver, transaction_id
`;
// =================================================
const KINDS = new Set(["trade", "transfer", "transaction"]);

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
  const account = positional[0];
  if (account === undefined) {
    console.error("missing account");
    process.exit(1);
  }
  const kinds_flag = flags["kinds"];
  const kinds = typeof kinds_flag === "string" ? csv(kinds_flag) : ["trade", "transfer", "transaction"];
  for (const k of kinds) {
    if (!KINDS.has(k)) {
      console.error(`--kinds entries must be one of ${[...KINDS].join("|")}`);
      process.exit(1);
    }
  }
  const limit = Number(flags["limit"] ?? 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    console.error("--limit must be 1..200");
    process.exit(1);
  }
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
  const token_flag = flags["token"];
  const token = typeof token_flag === "string" ? token_flag : undefined;

  const api = new intear_api();
  try {
    // Fields must match `kinds` — only request fields for kinds we asked for.
    const want_trade = kinds.includes("trade");
    const want_transfer = kinds.includes("transfer");
    const want_transaction = kinds.includes("transaction");
    const fields_input: Record<string, readonly never[]> = {};
    if (want_trade) {
      fields_input["trade"] = ["id", "timestamp_millis", "trader", "side", "amount", "usd_value"] as never;
    }
    if (want_transfer) {
      fields_input["transfer"] = ["id", "timestamp_millis", "kind", "sender", "receiver", "amount", "token"] as never;
    }
    if (want_transaction) {
      fields_input["transaction"] = ["id", "timestamp_millis", "sender", "receiver", "transaction_id"] as never;
    }
    const res = await api.activity.query({
      account,
      kinds: kinds as never,
      fields: fields_input as never,
      limit,
      order: "newest",
      ...(after_millis !== undefined ? { after_millis } : {}),
      ...(token !== undefined ? { token } : {}),
    });
    if (res.rows.length === 0) {
      console.log(`no activity for ${account}`);
      return;
    }
    const rows: Array<Record<string, unknown>> = [];
    for (const row of res.rows) {
      const kind = String(row[0]);
      const data: Record<string, unknown> = {};
      const cols = kind === "trade"
        ? res.columns.trade
        : kind === "transfer"
        ? res.columns.transfer
        : res.columns.transaction;
      if (!cols) continue;
      for (let i = 0; i < cols.length; i++) {
        const col_name = cols[i];
        const value = row[i + 1];
        if (col_name !== undefined) data[col_name] = value;
      }
      const ts = data["timestamp_millis"];
      if (typeof ts === "number") {
        data["time"] = new Date(ts).toISOString().replace("T", " ").slice(0, 19);
      }
      rows.push({ kind, ...data });
    }
    console.log(`\n${res.rows.length} event(s) for ${account}:`);
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
