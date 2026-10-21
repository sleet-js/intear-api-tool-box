// =========================
// Shared CLI helpers for the bin/ scripts. Not part of the published
// surface — `bin/` is for example users.
// =========================

// Tiny key/value parser for `--flag=value` and `--flag value` styles, plus
// positional args. Returns the positional array and the flag map.
export interface parsed_args {
  positional: string[];
  flags: Record<string, string | boolean>;
}

const is_flag = (s: string): boolean => s.startsWith("--");

export const parse_args = (
  argv: readonly string[],
): parsed_args => {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === undefined) continue;
    if (!is_flag(a)) {
      positional.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    let key: string;
    let value: string | boolean;
    if (eq >= 0) {
      key = a.slice(2, eq);
      value = a.slice(eq + 1);
    } else {
      key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !is_flag(next)) {
        value = next;
        i += 1;
      } else {
        value = true;
      }
    }
    flags[key] = value;
  }
  return { positional, flags };
};

// Look up a flag, or fall back to `fallback`. Throws with usage if required
// and missing.
export const arg = (
  flags: Record<string, string | boolean>,
  name: string,
  fallback: string | null,
  usage?: string,
): string => {
  const v = flags[name];
  if (v === undefined || v === true) {
    if (fallback !== null) return fallback;
    throw new Error(
      `missing --${name}` + (usage !== undefined ? `\nUsage: ${usage}` : ""),
    );
  }
  return String(v);
};

// Parse a comma-separated list and trim each entry.
export const csv = (s: string): string[] =>
  s.split(",").map((x) => x.trim()).filter((x) => x.length > 0);

// Standardised error printer for bins: distinguishes HTTP/WS errors from
// programming bugs.
export const fail = (err: unknown): never => {
  if (err instanceof Error) {
    const any_err = err as Error & { status?: number; code?: string };
    if (typeof any_err.status === "number" && typeof any_err.code === "string") {
      console.error(`\nAPI error (HTTP ${any_err.status}, code ${any_err.code}): ${err.message}`);
    } else {
      console.error("\nUnexpected error:", err.message);
    }
  } else {
    console.error("\nUnexpected error:", err);
  }
  process.exit(1);
};
