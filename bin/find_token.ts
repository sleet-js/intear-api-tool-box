#!/usr/bin/env bun
// =================================================
// find_token — search tokens by name, symbol, or account id.
//
// Examples:
//   bun run bin/find_token.ts wrap
//   bun run bin/find_token.ts USDt --limit 5
//   bun run bin/find_token.ts meme-cooking --reputation NotFake
// =================================================
import { intear_api, api_error, REPUTATIONS } from "../src/index";
import { parse_args, fail } from "./_args";

const USAGE = `
Usage: bun run bin/find_token.ts <query> [options]

  --limit <N>             Max results (1..100, default 10)
  --reputation <level>    One of ${REPUTATIONS.join("|")} (default Unknown)
  --holder <account>      Rank results by this holder (optional)
  --fields <a,b,c>        Fields to show per match (default symbol,decimals,price_usd,holders)
  --help                  Show this message
`;
// =================================================
async function main(): Promise<void> {
  const { positional, flags } = parse_args(process.argv.slice(2));
  if ("help" in flags || positional.length < 1) {
    console.log(USAGE);
    process.exit(positional.length < 1 ? 1 : 0);
  }
  const q = positional[0];
  if (q === undefined) {
    console.error("missing query");
    process.exit(1);
  }
  const limit = Number(flags["limit"] ?? 10);
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    console.error("--limit must be 1..100");
    process.exit(1);
  }
  const reputation_flag = flags["reputation"];
  const reputation =
    typeof reputation_flag === "string" ? reputation_flag : "Unknown";
  if (!REPUTATIONS.includes(reputation as never)) {
    console.error(`--reputation must be one of ${REPUTATIONS.join("|")}`);
    process.exit(1);
  }
  const holder_flag = flags["holder"];
  const holder = typeof holder_flag === "string" ? holder_flag : undefined;
  const show_fields = String(
    flags["fields"] ?? "symbol,decimals,price_usd,holders,volume_usd_24h",
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const api = new intear_api();
  try {
    const res = await api.tokens.search({
      q,
      fields: show_fields as never,
      limit,
      min_reputation: reputation as never,
      ...(holder !== undefined ? { holder } : {}),
    });
    if (res.rows.length === 0) {
      console.log(`no tokens matched '${q}'`);
      return;
    }
    const rows: Array<Record<string, unknown>> = [];
    for (const row of res.rows) {
      const r: Record<string, unknown> = { account_id: row[0] };
      for (let i = 0; i < show_fields.length; i++) {
        const f = show_fields[i];
        const v = row[i + 1];
        if (f !== undefined) r[f] = v;
      }
      rows.push(r);
    }
    console.log(`${res.rows.length} match(es) for '${q}':`);
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
