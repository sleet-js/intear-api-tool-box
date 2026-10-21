// =========================
// Nominal / branded primitive types.
// These add compile-time safety without any runtime cost:
// `DECIMAL_STRING` and `ACCOUNT_ID` are still plain strings at runtime, but a
// function expecting one of them will not accept a bare `string` literal.
// =========================

declare const brand: unique symbol;

export type DECIMAL_STRING = string & { readonly [brand]: "DECIMAL_STRING" };
export type ACCOUNT_ID = string & { readonly [brand]: "ACCOUNT_ID" };
export type ICON_HASH = string & { readonly [brand]: "ICON_HASH" };

// Coerce an arbitrary `string` into a branded type. Use at trust boundaries
// (parsing API responses, reading user input).
export const as_decimal_string = (s: string): DECIMAL_STRING => s as DECIMAL_STRING;
export const as_account_id = (s: string): ACCOUNT_ID => s as ACCOUNT_ID;
export const as_icon_hash = (s: string): ICON_HASH => s as ICON_HASH;
