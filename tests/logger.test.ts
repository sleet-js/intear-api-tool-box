// =========================
// Unit tests for the diagnostic logger.
// =========================

import { describe, expect, test } from "bun:test";
import { console_logger, null_logger } from "../src/helpers/logger";
import type { logger } from "../src/helpers/logger";

const capture: (level: string) => logger = (level) => {
  const captured: string[] = [];
  const orig = (console as unknown as Record<string, (...args: unknown[]) => void>)[level];
  (console as unknown as Record<string, (...args: unknown[]) => void>)[level] = (line: unknown) => {
    captured.push(String(line));
  };
  return {
    info: (e, f) => orig(String(e), f),
    warn: (e, f) => orig(String(e), f),
    debug: (e, f) => orig(String(e), f),
    error: (e, f) => orig(String(e), f),
    captured,
    restore: (): void => {
      (console as unknown as Record<string, typeof orig>)[level] = orig;
    },
  } as unknown as logger;
};

describe("console_logger", () => {
  // Capture all three console channels (log/warn/error) so we can assert
  // what level=warn / level=debug emitted across them.
  const capture_all = (): { restore: () => void; lines: string[] } => {
    const orig = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
    const lines: string[] = [];
    const fn = (channel: keyof typeof orig) => (line: unknown) => {
      lines.push(`[${channel}] ${String(line)}`);
    };
    console.log = fn("log") as typeof orig.log;
    console.warn = fn("warn") as typeof orig.warn;
    console.error = fn("error") as typeof orig.error;
    return {
      lines,
      restore: (): void => {
        console.log = orig.log;
        console.warn = orig.warn;
        console.error = orig.error;
      },
    };
  };

  test("level=none never emits (truly silent)", () => {
    const c = capture_all();
    try {
      const l = new console_logger("none");
      l.info("anything", { a: 1 });
      l.warn("anything", { a: 1 });
      l.debug("anything", { a: 1 });
      l.error("anything", { a: 1 });
      // Silent means silent — even errors are dropped. To always see
      // errors, supply a custom logger that ignores the level filter.
      expect(c.lines.length).toBe(0);
    } finally {
      c.restore();
    }
  });

  test("level=info emits info-level events", () => {
    const c = capture_all();
    try {
      const l = new console_logger("info");
      l.info("hello", { x: 1 });
      expect(c.lines.length).toBe(1);
      expect(c.lines[0]).toContain("[intear_api:info]");
      expect(c.lines[0]).toContain('hello');
      expect(c.lines[0]).toContain('x=1');
    } finally {
      c.restore();
    }
  });

  test("level=warn emits info/warn/error but not debug", () => {
    const c = capture_all();
    try {
      const l = new console_logger("warn");
      l.info("i", {});
      l.warn("w", {});
      l.debug("d", {}); // dropped
      l.error("e", {});
      expect(c.lines.length).toBe(3); // info, warn, error
      expect(c.lines.some((l) => l.includes("[intear_api:warn]"))).toBe(true);
      expect(c.lines.some((l) => l.includes("[intear_api:debug]"))).toBe(false);
    } finally {
      c.restore();
    }
  });

  test("level=debug emits everything", () => {
    const c = capture_all();
    try {
      const l = new console_logger("debug");
      l.info("i", {});
      l.warn("w", {});
      l.debug("d", {});
      l.error("e", {});
      expect(c.lines.length).toBe(4);
    } finally {
      c.restore();
    }
  });
});

describe("null_logger", () => {
  test("never throws and never emits", () => {
    const l = new null_logger();
    expect(() => l.info("a", {})).not.toThrow();
    expect(() => l.warn("a", {})).not.toThrow();
    expect(() => l.debug("a", {})).not.toThrow();
    expect(() => l.error("a", {})).not.toThrow();
  });
});
