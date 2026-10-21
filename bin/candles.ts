#!/usr/bin/env bun
// =================================================
// candles — last N candles for a token. Optional --csv output.
//
// Examples:
//   bun run bin/candles.ts wrap.near --resolution 1h --count_back 24
//   bun run bin/candles.ts wrap.near --resolution D --count_back 30 --csv
//   bun run bin/candles.ts wrap.near usdt.tether-token.near --resolution 1h --quote near
// =================================================
import { intear_api, api_error } from "../src/index";
import { parse_args, csv, fail } from "./_args";
import type { candle_resolution } from "../src/types/candle";

const USAGE = `
Usage: bun run bin/candles.ts <token> [<token>...] [options]

  --resolution <r>    1S|1|5|15|60|240|D|W (1m/5m/15m/60m/240m/4h/24h/1d/1w/7d accepted aliases)
                      Default: 1h
  --count_back <N>    Number of candles per token (max 5000, default 24)
  --quote <c>         usd (default) | near | usd,near
  --series <a,b,c>    subset of open,high,low,close,volume (default all)
  --csv               Print CSV instead of a table
  --help              Show this message
`;
// =================================================
async function main(): Promise<void> {
  const { positional, flags } = parse_args(process.argv.slice(2));
  if ("help" in flags || positional.length < 1) {
    console.log(USAGE);
    process.exit(positional.length < 1 ? 1 : 0);
  }
  const tokens = positional;
  if (tokens.length === 0 || tokens.length > 200) {
    console.error("need 1..200 tokens");
    process.exit(1);
  }
  const resolution = String(flags["resolution"] ?? "1h");
  const count_back = Number(flags["count_back"] ?? 24);
  if (!Number.isInteger(count_back) || count_back < 1 || count_back > 5000) {
    console.error("--count_back must be 1..5000");
    process.exit(1);
  }
  const quote_raw = String(flags["quote"] ?? "usd");
  const quote_input = quote_raw === "usd" || quote_raw === "near"
    ? quote_raw
    : csv(quote_raw);
  const series = "series" in flags
    ? csv(String(flags["series"]))
    : ["open", "high", "low", "close", "volume"];
  const as_csv = "csv" in flags;

  const api = new intear_api();
  try {
    const res = await api.candles.get({
      tokens,
      resolution: resolution as candle_resolution,
      count_back,
      series: series as never,
      quote: quote_input as never,
    });
    const to_ms = (s: number): string =>
      new Date(s).toISOString().replace("T", " ").slice(0, 19);
    for (const token of tokens) {
      const data = res.tokens[token];
      if (!data) {
        console.log(`\n[${token}] no candles returned (token may not exist)`);
        continue;
      }
      const opens = data.usd?.open ?? [];
      const highs = data.usd?.high ?? [];
      const lows = data.usd?.low ?? [];
      const closes = data.usd?.close ?? [];
      const vols = data.usd?.volume ?? [];
      const times = data.time;
      const rows: Array<Record<string, unknown>> = [];
      for (let i = 0; i < times.length; i++) {
        const t = times[i] ?? 0;
        rows.push({
          time: to_ms(t),
          open: opens[i] ?? null,
          high: highs[i] ?? null,
          low: lows[i] ?? null,
          close: closes[i] ?? null,
          volume: vols[i] ?? null,
        });
      }
      console.log(`\n[${token}] ${resolution} (${times.length} candles)`);
      if (as_csv) {
        console.log("time,open,high,low,close,volume");
        for (const r of rows) {
          console.log(
            `${r["time"]},${r["open"] ?? ""},${r["high"] ?? ""},${r["low"] ?? ""},${r["close"] ?? ""},${r["volume"] ?? ""}`,
          );
        }
      } else {
        console.table(rows);
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
