#!/usr/bin/env bun
// =================================================
// icons_index (top tokens by 24h volume + their icon URLs)
//
// Asks the API for the three highest-volume tokens in the last 24h
// (sorted by `volume_usd_24h`), then builds the public icon URL for
// each via `api.misc.icon_url(icon_hash)` and prints it. The URLs are
// cacheable WebP images you can drop straight into an <img>.
//
// Run:
//   bun run bin/icons_index_bin.ts
//
// No CLI args, no env. Read-only. Tokens with no icon_hash are
// reported as such instead of being given a broken URL.
// =================================================
import { IntearApi, ApiError } from "../src/index";
import type { Reputation } from "../src/types/common";
// =================================================
const TOP_N = 3;

const usd = (v: string | number | null | undefined, dp = 0): string => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: dp })}`;
};
// =================================================
async function main(): Promise<void> {
  const api = new IntearApi();
  console.log(`Fetching top ${TOP_N} tokens by 24h volume ...`);

  const res = await api.tokens.get({
    fields: ["symbol", "icon_hash", "volume_usd_24h"],
    where: { min_reputation: "NotFake" as Reputation },
    sort: { by: "volume_usd_24h", desc: true },
    limit: TOP_N,
  });

  if (res.rows.length === 0) {
    console.log("  (no tokens returned)");
    api.close();
    process.exit(0);
  }

  const rows = res.rows.map((row, i) => {
    const [account_id, symbol, icon_hash, volume_usd_24h] = row;
    // icon_hash comes back typed as the field union; coerce to a
    // plain string (it is a webp content hash) before building the URL.
    const hash = icon_hash === null || icon_hash === undefined ? "" : String(icon_hash);
    return {
      rank: i + 1,
      symbol: symbol ?? "-",
      account_id,
      volume_usd_24h: usd(volume_usd_24h),
      icon_url: hash.length > 0 ? api.misc.icon_url(hash) : "(no icon)",
    };
  });

  console.table(rows);
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