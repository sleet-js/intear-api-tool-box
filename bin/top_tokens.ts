#!/usr/bin/env bun
// =================================================
// top_tokens — top-N tokens by a sortable field, with optional filters.
//
// Examples:
//   bun run bin/top_tokens.ts --sort=-volume_usd_24h --limit 10
//   bun run bin/top_tokens.ts --sort=-liquidity_usd --where min_reputation=Reputable --limit 5
//   bun run bin/top_tokens.ts --sort=-volume_usd_24h --limit 20 --fields symbol,price_usd
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, fail } from "./_args";

const USAGE = `
Usage: bun run bin/top_tokens.ts [options]

  --sort <[-]field>           Field to sort by. Prefix with '-' for descending
                              (default: -volume_usd_24h)
  --limit <N>                 Number of tokens (1..200, default 20)
  --where <key=value>         Optional filter. Repeatable. Known keys:
                                min_reputation (Spam|Unknown|NotFake|Reputable)
                                deleted        (true|false)
                                min.<field>    numeric lower bound
                                max.<field>    numeric upper bound
                                parent         account id (tokens directly under it)
  --fields <a,b,c>            Comma-separated fields to show in addition to
                              the sort field (default: symbol,decimals,price_usd,
                              holders,volume_usd_24h)
  --help                      Show this message
`;
// =================================================
const SORT_FIELDS = [
  "volume_usd_5m",
  "volume_usd_15m",
  "volume_usd_1h",
  "volume_usd_6h",
  "volume_usd_24h",
  "liquidity_usd",
  "market_cap_usd",
  "fdv_usd",
  "holders",
  "price_usd",
  "price_change_5m",
  "price_change_15m",
  "price_change_1h",
  "price_change_6h",
  "price_change_24h",
  "buys_24h",
  "sells_24h",
  "traders_24h",
  "decimals",
] as const;
const SORTABLE: ReadonlySet<string> = new Set(SORT_FIELDS);
const REPUTATIONS = new Set(["Spam", "Unknown", "NotFake", "Reputable"]);
// =================================================
async function main(): Promise<void> {
  const { positional, flags } = parse_args(process.argv.slice(2));
  if ("help" in flags) {
    console.log(USAGE);
    process.exit(0);
  }
  if (positional.length > 0) {
    console.error("top_tokens takes no positional args");
    console.log(USAGE);
    process.exit(1);
  }

  const sort_input = String(flags["sort"] ?? "-volume_usd_24h");
  const desc = sort_input.startsWith("-");
  const sort_field = desc ? sort_input.slice(1) : sort_input;
  if (!SORTABLE.has(sort_field)) {
    console.error(
      `--sort must be one of ${SORT_FIELDS.join(", ")} (with optional '-' prefix)`,
    );
    process.exit(1);
  }
  const limit = Number(flags["limit"] ?? 20);
  if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
    console.error("--limit must be 1..200");
    process.exit(1);
  }

  type where_entry = { key: string; value: string };
  const where_input = "where" in flags ? flags["where"] : undefined;
  const where_entries: where_entry[] = [];
  if (typeof where_input === "string") {
    for (const part of where_input.split(",")) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const key = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      if (key.length === 0 || value.length === 0) continue;
      where_entries.push({ key, value });
    }
  }
  const where: Record<string, unknown> = {};
  const min_filters: Record<string, number> = {};
  const max_filters: Record<string, number> = {};
  for (const { key, value } of where_entries) {
    if (key === "min_reputation") {
      if (!REPUTATIONS.has(value)) {
        console.error(`--where min_reputation must be one of ${[...REPUTATIONS].join("|")}`);
        process.exit(1);
      }
      where["min_reputation"] = value;
      continue;
    }
    if (key === "deleted") {
      if (value !== "true" && value !== "false") {
        console.error("--where deleted must be 'true' or 'false'");
        process.exit(1);
      }
      where["deleted"] = value === "true";
      continue;
    }
    if (key === "parent") {
      where["parent"] = value;
      continue;
    }
    if (key.startsWith("min.") || key.startsWith("max.")) {
      const field = key.slice(4);
      const bucket = key.startsWith("min.") ? min_filters : max_filters;
      const n = Number(value);
      if (!Number.isFinite(n)) {
        console.error(`--where ${key} must be numeric`);
        process.exit(1);
      }
      bucket[field] = n;
      continue;
    }
    console.error(`unknown --where key '${key}'`);
    process.exit(1);
  }
  if (Object.keys(min_filters).length > 0) where["min"] = min_filters;
  if (Object.keys(max_filters).length > 0) where["max"] = max_filters;

  const show_fields = String(
    flags["fields"] ?? "symbol,decimals,price_usd,holders,volume_usd_24h",
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  // `account_id` is auto-included; we don't need to ask for it.
  const request_fields = show_fields.filter((f) => f !== "account_id");
  if (!request_fields.includes(sort_field)) request_fields.push(sort_field);

  const api = new intear_api();
  try {
    const res = await api.tokens.get({
      fields: request_fields as never,
      sort: { by: sort_field as never, desc },
      limit,
      ...(Object.keys(where).length > 0 ? { where } : {}),
    });
    if (res.rows.length === 0) {
      console.log("no tokens matched");
      return;
    }
    const rows: Array<Record<string, unknown>> = [];
    for (const row of res.rows) {
      const r: Record<string, unknown> = { account_id: row[0] };
      for (let i = 0; i < request_fields.length; i++) {
        const f = request_fields[i];
        const v = row[i + 1];
        if (f !== undefined) r[f] = v;
      }
      rows.push(r);
    }
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
