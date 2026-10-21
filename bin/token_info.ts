#!/usr/bin/env bun
// =================================================
// token_info — show requested fields for one token by account id.
//
// Examples:
//   bun run bin/token_info.ts wrap.near
//   bun run bin/token_info.ts usdt.tether-token.near --fields symbol,price_usd,volume_usd_24h,holders
//   bun run bin/token_info.ts wrap.near --json
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, fail } from "./_args";
import type { tokens_get_response, token_requested_field } from "../src/types/token";
// =================================================
type flexible_get_response = tokens_get_response<token_requested_field[]>;

const USAGE = `
Usage: bun run bin/token_info.ts <token_account_id> [options]

  --fields <a,b,c>     Comma-separated list of fields to show
                       (default: symbol,decimals,price_usd,holders,total_supply,volume_usd_24h)
  --json               Print the raw row as JSON instead of a table
  --help               Show this message
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
    console.error("missing token account id");
    console.log(USAGE);
    process.exit(1);
  }
  const fields = String(
    flags["fields"] ??
      "symbol,decimals,price_usd,holders,total_supply,volume_usd_24h",
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const as_json = "json" in flags;

  const api = new intear_api();
  try {
    const res = (await api.tokens.get({
      // Field names are typed as `token_requested_field` in the SDK; bins
      // accept arbitrary strings and trust the server's whitelist.
      fields: fields as token_requested_field[],
      ids: [token],
    })) as flexible_get_response;
    if (res.rows.length === 0) {
      console.error(`token not found: ${token}`);
      process.exit(1);
    }
    const row = res.rows[0];
    if (!row) {
      console.error(`token not found: ${token}`);
      process.exit(1);
    }
    const [, ...values] = row;
    if (as_json) {
      const out: Record<string, unknown> = {};
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const v = values[i];
        if (f !== undefined) out[f] = v;
      }
      out["account_id"] = token;
      console.log(JSON.stringify(out, null, 2));
    } else {
      const lines: Array<{ field: string; value: string }> = [];
      lines.push({ field: "account_id", value: token });
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const v = values[i];
        lines.push({
          field: f ?? "?",
          value: v === null || v === undefined ? "-" : String(v),
        });
      }
      console.table(lines);
      if (res.height !== undefined) {
        console.log(`\nat height ${res.height} (${new Date(res.timestamp_millis).toISOString()})`);
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
