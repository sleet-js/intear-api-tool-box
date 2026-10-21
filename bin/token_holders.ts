#!/usr/bin/env bun
// =================================================
// token_holders — largest holders of a token, with share % of the top.
//
// Examples:
//   bun run bin/token_holders.ts wrap.near --limit 20
//   bun run bin/token_holders.ts wrap.near --live --top 50
// =================================================
import { intear_api, api_error, subscription_error } from "../src/index";
import { parse_args, fail } from "./_args";

const USAGE = `
Usage: bun run bin/token_holders.ts <token> [options]

  --limit <N>         1..100, default 25
  --live              Subscribe to top-N holders live (default: one-shot query)
  --top <N>           1..1000, used with --live (default 100)
  --cursor <string>   Resume paging from previous next_cursor
  --raw               Print raw rows only (no share %)
  --help              Show this message
`;
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
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    console.error("--limit must be 1..100");
    process.exit(1);
  }
  const live = "live" in flags;
  const top_flag = flags["top"];
  const top = typeof top_flag === "string" ? Number(top_flag) : 100;
  if (!Number.isInteger(top) || top < 1 || top > 1000) {
    console.error("--top must be 1..1000");
    process.exit(1);
  }
  const cursor_flag = flags["cursor"];
  const cursor = typeof cursor_flag === "string" ? cursor_flag : undefined;
  const raw = "raw" in flags;

  const api = new intear_api();

  if (live) {
    const sub = api.holders.subscribe({ token, top });
    let stopping = false;
    const close = async (): Promise<void> => {
      if (stopping) return;
      stopping = true;
      try { await sub.close(); } catch { /* ignore */ }
      api.close();
      process.exit(0);
    };
    process.on("SIGINT", close);
    process.on("SIGTERM", close);
    try {
      const snapshot = await sub.result;
      const total_holders = snapshot.total ?? "n/a";
      console.log(`\ntotal holders indexed: ${total_holders}`);
      console.log(`\ntop ${snapshot.rows.length} (live, Ctrl+C to stop):`);
      const rows = snapshot.rows.map((r, i) => ({
        rank: i + 1,
        account_id: r[0],
        balance: r[1],
      }));
      console.table(rows);
      for await (const push of sub) {
        if (push.left?.length) {
          console.log(`\nleft top:  ${push.left.join(", ")}`);
        }
        for (const [account, balance] of Object.entries(push.set ?? {})) {
          console.log(`updated: ${account} = ${balance}`);
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
    return;
  }

  try {
    const res = await api.holders.get({
      token,
      limit,
      ...(cursor !== undefined ? { cursor } : {}),
    });
    if (res.rows.length === 0) {
      console.log(`no holders returned for ${token}`);
      return;
    }
    let total_top = BigInt(0);
    for (const [, b] of res.rows) total_top += BigInt(String(b));
    const rows: Array<Record<string, unknown>> = [];
    for (let i = 0; i < res.rows.length; i++) {
      const r = res.rows[i];
      if (!r) continue;
      const balance = String(r[1]);
      const share = total_top === 0n
        ? "-"
        : `${(Number(BigInt(balance) * 10_000n / total_top) / 100).toFixed(2)}%`;
      if (raw) {
        rows.push({ rank: i + 1, account_id: r[0], balance });
      } else {
        rows.push({ rank: i + 1, account_id: r[0], balance, share_of_top: share });
      }
    }
    console.log(`\ntotal holders indexed: ${res.total ?? "n/a"}`);
    console.log(`top ${res.rows.length}:`);
    console.table(rows);
    if (res.next_cursor !== null && res.next_cursor !== undefined) {
      console.log(`\nmore pages available — pass --cursor '${res.next_cursor}' to continue`);
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
