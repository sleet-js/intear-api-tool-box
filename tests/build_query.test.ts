// =========================
// Pure unit tests for `build_query` — no network. Catches regressions on the
// URL-encoding rules: comma-separated lists, dotted keys for objects, top-
// level `where.*`, the boolean-not-string quirk in `sort`, and `desc: true`
// -> `-field` rewrite.
// =========================

import { describe, expect, test } from "bun:test";
import { build_query } from "../src/client/http_client";

describe("build_query", () => {
  test("encodes a flat key with a string value", () => {
    expect(build_query({ q: "wrap" })).toBe("q=wrap");
  });

  test("trims undefined/null values", () => {
    expect(build_query({ a: "x", b: undefined, c: null })).toBe("a=x");
  });

  test("CSV-encodes an array, skipping undefined/null", () => {
    expect(
      build_query({ fields: ["symbol", "price_usd"], ids: ["wrap.near", undefined] }),
    ).toBe("fields=symbol%2Cprice_usd&ids=wrap.near");
  });

  test("dotted keys for nested objects other than where", () => {
    expect(
      build_query({ min_change: { price_usd: "0.1%" } }),
    ).toBe("min_change.price_usd=0.1%25");
  });

  test("where's keys are unprefixed", () => {
    expect(
      build_query({ where: { min_reputation: "NotFake" } }),
    ).toBe("min_reputation=NotFake");
  });

  test("sort { by, desc: true } becomes `-field`", () => {
    expect(
      build_query({ sort: { by: "volume_usd_24h", desc: true } }),
    ).toBe("sort=-volume_usd_24h");
  });

  test("sort { by } (ascending) becomes `field`", () => {
    expect(
      build_query({ sort: { by: "volume_usd_24h" } }),
    ).toBe("sort=volume_usd_24h");
  });

  test("booleans render as the literal `true`/`false` strings", () => {
    expect(build_query({ deleted: true })).toBe("deleted=true");
    expect(build_query({ deleted: false })).toBe("deleted=false");
  });

  test("numbers render as-is, not stringified-then-rewrapped", () => {
    expect(build_query({ limit: 10 })).toBe("limit=10");
  });
});
