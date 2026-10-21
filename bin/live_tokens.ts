#!/usr/bin/env bun
// =================================================
// live_tokens — WebSocket subscription to tokens.subscribe for one or more
// tokens. Live updates only carry what changed (per min_change threshold).
// Ctrl+C to exit.
//
// Examples:
//   bun run bin/live_tokens.ts wrap.near
//   bun run bin/live_tokens.ts wrap.near usdt.tether-token.near --min_change price_usd=0.1%
//   bun run bin/live_tokens.ts wrap.near --fields price_usd,volume_usd_24h --silent
// =================================================
import { intear_api, subscription_error, subscription_no_snapshot } from "../src/index";
import { parse_args, fail } from "./_args";
import type { min_change_threshold } from "../src/types/common";
import { MIN_CHANGE_THRESHOLDS } from "../src/types/common";

const USAGE = `
Usage: bun run bin/live_tokens.ts <token> [<token>...] [options]

  --fields <a,b,c>             Comma-separated fields to follow
                                (default: symbol,price_usd,volume_usd_24h)
  --min_change <field=value>   Threshold per field, e.g. price_usd=0.1%,volume_usd_24h=1%
                                Thresholds: ${MIN_CHANGE_THRESHOLDS.join(", ")}
                                Repeatable.
  --min_interval <ms>          Throttle. one of 200|600|1000|5000|15000|60000 ms
  --silent                     Don't print every push; just count
  --help                       Show this message
`;
// =================================================
const INTERVALS = new Set([200, 600, 1000, 5000, 15000, 60_000]);
// =================================================
async function main(): Promise<void> {
  const { positional, flags } = parse_args(process.argv.slice(2));
  if ("help" in flags || positional.length < 1) {
    console.log(USAGE);
    process.exit(positional.length < 1 ? 1 : 0);
  }
  const tokens = positional;
  if (tokens.length === 0) {
    console.error("need at least one token");
    process.exit(1);
  }
  const fields = String(
    flags["fields"] ?? "symbol,price_usd,volume_usd_24h",
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  type min_change_entry = { field: string; threshold: string };
  const min_change_input = "min_change" in flags ? flags["min_change"] : undefined;
  const min_change_entries: min_change_entry[] = [];
  if (typeof min_change_input === "string") {
    for (const part of min_change_input.split(",")) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const field = part.slice(0, eq).trim();
      const threshold = part.slice(eq + 1).trim();
      if (field.length === 0 || threshold.length === 0) continue;
      min_change_entries.push({ field, threshold });
    }
  }
  const min_change_map: Record<string, string> = {};
  for (const { field, threshold } of min_change_entries) {
    if (!(MIN_CHANGE_THRESHOLDS as readonly string[]).includes(threshold)) {
      console.error(
        `--min_change ${field}=${threshold}: threshold must be one of ${MIN_CHANGE_THRESHOLDS.join(", ")}`,
      );
      process.exit(1);
    }
    min_change_map[field] = threshold;
  }

  const min_interval_flag = flags["min_interval"];
  let min_interval_ms: number | undefined;
  if (typeof min_interval_flag === "string") {
    const n = Number(min_interval_flag);
    if (!INTERVALS.has(n)) {
      console.error(`--min_interval must be one of ${[...INTERVALS].join(",")}`);
      process.exit(1);
    }
    min_interval_ms = n;
  }
  const silent = "silent" in flags;

  const api = new intear_api();
  const sub = api.tokens.subscribe({
    fields: fields as never,
    ids: tokens,
    ...(Object.keys(min_change_map).length > 0
      ? { min_change: min_change_map as Record<string, min_change_threshold> }
      : {}),
    ...(min_interval_ms !== undefined ? { min_interval_ms } : {}),
  });

  let live_pushes = 0;
  let stopping = false;
  const close = async (): Promise<void> => {
    if (stopping) return;
    stopping = true;
    console.log("\nclosing subscription ...");
    try {
      await sub.close();
    } catch {
      /* ignore */
    }
    api.close();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  try {
    // The SDK now resolves `sub.result` either with the snapshot or with
    // `subscription_no_snapshot` once a push has been received.
    const initial = await sub.result;
    if (!(initial instanceof subscription_no_snapshot) && initial.rows.length > 0) {
      const initial_map: Record<string, unknown> = {};
      for (const row of initial.rows) {
        const account_id = String(row[0]);
        const fields_obj: Record<string, unknown> = {};
        for (let i = 0; i < fields.length; i++) {
          const f = fields[i];
          if (f !== undefined) fields_obj[f] = row[i + 1];
        }
        initial_map[account_id] = fields_obj;
      }
      console.log(`\n--- initial snapshot (${initial.rows.length} tokens) ---`);
      console.dir(initial_map, { depth: null, colors: false });
    } else if (!silent) {
      console.log("(no initial snapshot — streaming will start with the first live push)");
    }
    console.log(`\nstreaming live updates (Ctrl+C to stop) ...\n`);
    for await (const push of sub) {
      live_pushes += 1;
      if (!silent) {
        console.log(`[push @ ${push.height}]`);
        if (push.created?.length) console.log("  created:", push.created.join(", "));
        if (push.left?.length) console.log("  left:   ", push.left.join(", "));
        for (const [tok, fields_obj] of Object.entries(push.set ?? {})) {
          console.log(`  ${tok}: ${JSON.stringify(fields_obj)}`);
        }
        process.stdout.write("\n");
      } else if (live_pushes % 50 === 0) {
        console.log(`${live_pushes} live pushes so far`);
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
}

main().catch(fail);
// =================================================
// copyright 2026 by sleet.near
