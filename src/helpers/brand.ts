// =========================
// Nominal / branded primitive types.
// These add compile-time safety without any runtime cost:
// `DecimalString` and `AccountId` are still plain strings at runtime, but a
// function expecting one of them will not accept a bare `string` literal.
// =========================

declare const brand: unique symbol;

export type DecimalString = string & { readonly [brand]: "DecimalString" };
export type AccountId = string & { readonly [brand]: "AccountId" };
export type IconHash = string & { readonly [brand]: "IconHash" };

// Coerce an arbitrary `string` into a branded type. Use at trust boundaries
// (parsing API responses, reading user input).
export const as_decimal_string = (s: string): DecimalString => s as DecimalString;
export const as_account_id = (s: string): AccountId => s as AccountId;
export const as_icon_hash = (s: string): IconHash => s as IconHash;
