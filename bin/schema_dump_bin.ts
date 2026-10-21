#!/usr/bin/env bun
// =================================================
// schema_dump (inspect the live API definition)
//
// Fetches the API's own `/schema` document via `api.misc.schema()`
// and prints the parts an SDK consumer cares about: the version,
// the rolling-window labels, the allowed change thresholds and
// interval values, the credit limits, and the HTTP path backing
// each RPC method. Purely read-only inspection — nothing here
// changes.
//
// Run:
//   bun run bin/schema_dump_bin.ts
//
// No CLI args, no env.
// =================================================
import { IntearApi, ApiError } from "../src/index";
// =================================================
async function main(): Promise<void> {
  const api = new IntearApi();
  console.log("Fetching live schema from https://api.intea.rs/schema ...");
  const schema = await api.misc.schema();

  console.log(`\nversion: ${schema.version}`);
  console.log(`height:  ${(schema as { height?: number }).height ?? "n/a"}`);

  console.log("\n--- windows ---");
  console.log(schema.windows.join(", "));

  console.log("\n--- thresholds (min_change) ---");
  console.log(schema.thresholds.join(", "));

  console.log("\n--- intervals_ms (min_interval_ms) ---");
  console.log(schema.intervals_ms.join(", "));

  console.log("\n--- limits ---");
  console.table(
    Object.entries(schema.limits).map(([name, value]) => ({ limit: name, value })),
  );

  // `methods` maps each RPC name to its definition; print the HTTP
  // path where one is defined. Defensive: a method may not expose one.
  console.log("\n--- methods (http paths) ---");
  const rows = Object.entries(schema.methods).map(([method, def]) => ({
    method,
    http_path: def?.http ?? "(ws only)",
  }));
  rows.sort((a, b) => a.method.localeCompare(b.method));
  if (rows.length === 0) {
    console.log("  (no methods in schema)");
  } else {
    console.table(rows);
  }

  // A few extra counts that are handy when eyeballing the schema.
  console.log(`\ntoken_fields:     ${schema.token_fields.length}`);
  console.log(`trade_fields:     ${schema.trade_fields.length}`);
  console.log(`transfer_fields:  ${schema.transfer_fields.length}`);
  console.log(`transaction_fields:${schema.transaction_fields.length}`);

  api.close();
  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  if (err instanceof ApiError) {
    console.error(`\nAPI error (HTTP ${err.status}, code ${err.code}): ${err.message}`);
  } else {
    console.error("\nUnexpected error:", err);
  }
  process.exit(1);
});
// =================================================
// copyright 2026 by sleet.near