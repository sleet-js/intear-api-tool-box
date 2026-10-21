#!/usr/bin/env bun
// =================================================
// token_icon — print the public icon URL for a token.
//
// Icon URLs are cacheable WebPs of up to 128×128 — drop them straight into an
// <img> or curl/--output to download.
//
// Examples:
//   bun run bin/token_icon.ts wrap.near
//   bun run bin/token_icon.ts usdt.tether-token.near
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, fail } from "./_args";

const USAGE = `
Usage: bun run bin/token_icon.ts <token_account_id>

Prints the icon's public URL to stdout. No flags.
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
  const api = new intear_api();
  try {
    const res = await api.tokens.get({
      fields: ["icon_hash"],
      ids: [token],
    });
    if (res.rows.length === 0) {
      console.error(`token not found: ${token}`);
      process.exit(1);
    }
    const row = res.rows[0];
    if (!row) {
      console.error(`token not found: ${token}`);
      process.exit(1);
    }
    const icon_hash = row[1];
    if (icon_hash === null || icon_hash === undefined) {
      console.error(`token ${token} has no icon_hash`);
      process.exit(1);
    }
    process.stdout.write(api.misc.icon_url(String(icon_hash)) + "\n");
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
