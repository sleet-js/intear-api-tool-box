#!/usr/bin/env bun
// =================================================
// account_balances — direct + native + Rhea balances for a NEAR account.
//
// Examples:
//   bun run bin/account_balances.ts v2.ref-finance.near
//   bun run bin/account_balances.ts intents.near --source direct,native
//   bun run bin/account_balances.ts <account> --tokens wrap.near,usdt.tether-token.near
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, csv, fail } from "./_args";

const USAGE = `
Usage: bun run bin/account_balances.ts <account> [options]

  --source <a,b,c>     Comma list of direct|native|rhea (default all three)
  --tokens <a,b,c>     Limit to these tokens (default: every known holding)
  --top <N>            Show the top N balances only, by value (default 25)
  --fields <a,b,c>     Per-token fields via token_fields (default symbol,decimals)
  --help               Show this message
`;
// =================================================
const SOURCES = new Set(["direct", "native", "rhea"]);
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
  const source_flag = flags["source"];
  const sources = typeof source_flag === "string"
    ? csv(source_flag)
    : ["direct", "native", "rhea"];
  for (const s of sources) {
    if (!SOURCES.has(s)) {
      console.error(`--source entries must be ${[...SOURCES].join("|")}`);
      process.exit(1);
    }
  }
  const tokens_flag = flags["tokens"];
  const tokens = typeof tokens_flag === "string" ? csv(tokens_flag) : undefined;
  const top = Number(flags["top"] ?? 25);
  if (!Number.isInteger(top) || top < 1) {
    console.error("--top must be a positive integer");
    process.exit(1);
  }
  const fields = String(flags["fields"] ?? "symbol,decimals,price_usd")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const api = new intear_api();
  try {
    const res = await api.balances.get({
      account,
      sources: sources as never,
      ...(tokens !== undefined ? { tokens } : {}),
      token_fields: fields as never,
    });
    console.log(`\nbalances for ${account}:`);
    if (res.balances.rows.length === 0) {
      console.log("(no balances)");
    } else {
      // Cap to non-zero, top N
      const all = res.balances.rows
        .filter(([, , balance]) => BigInt(balance) > 0n)
        .slice(0, top);
      const token_meta: Record<string, Record<string, unknown>> = {};
      if (res.tokens) {
        for (const row of res.tokens.rows) {
          const r: Record<string, unknown> = {};
          for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            const v = row[i + 1];
            if (f !== undefined) r[f] = v;
          }
          token_meta[String(row[0])] = r;
        }
      }
      const rows = all.map(([token, source, balance]) => ({
        token,
        source,
        balance,
        ...(token_meta[token] ?? {}),
      }));
      console.table(rows);
    }
    const err_entries = Object.entries(res.errors ?? {});
    if (err_entries.length > 0) {
      console.log("\nsource errors:");
      for (const [src, e] of err_entries) {
        console.log(`  ${src}: ${e.code} — ${e.message}`);
      }
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
