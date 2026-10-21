// =========================
// `table_to_objects(table)` — turns the API's `{ columns, rows }` shape into a
// `Record<key, fields>` map keyed by the first column. The shape that's
// usually most ergonomic for UI lists.
//
// We intentionally keep the value type loose (`Record<string, unknown>`) here:
// the per-field value types are already encoded in your `fields` argument at
// the call site, and inferring them again at this layer adds no real safety.
// If you need them, write `table_to_objects<F>(table as Table<F>)` yourself or
// wrap the result with a typed view per call site.
// =========================

import type { Table } from "../../types/common";

export const table_to_objects = (
  table: Table<readonly unknown[]>,
): Record<string, Record<string, unknown>> => {
  const out: Record<string, Record<string, unknown>> = {};
  if (table.columns.length === 0) return out;
  for (const row of table.rows) {
    const key = String(row[0]);
    const object: Record<string, unknown> = {};
    for (let i = 1; i < table.columns.length; i++) {
      const column = table.columns[i];
      const value = row[i];
      // `column` is a string; only assign when defined.
      if (column !== undefined) object[column] = value;
    }
    out[key] = object;
  }
  return out;
};
