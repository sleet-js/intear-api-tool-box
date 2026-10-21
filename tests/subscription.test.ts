// =========================
// Unit tests for Subscription: `result` resolves with the snapshot when
// delivered; resolves with `subscription_no_snapshot` once the first push
// arrives without a snapshot ever arriving; rejects / settles via `end`
// when the server closes the subscription.
// =========================

import { describe, expect, test } from "bun:test";
import {
  subscription_impl,
  subscription_no_snapshot,
} from "../src/helpers/subscribe";

interface fake_push {
  height: number;
  rows: number[];
}

describe("subscription_impl", () => {
  test("result resolves with the snapshot when set_result fires", async () => {
    const sub = new subscription_impl<fake_push, { rows: number[] }>({
      unsubscribe_fn: async () => {
        /* no-op */
      },
    });
    sub.set_result({ rows: [1, 2, 3] });
    const r = await sub.result;
    expect(r).toEqual({ rows: [1, 2, 3] });
  });

  test("first push without snapshot resolves result as no_snapshot", async () => {
    const sub = new subscription_impl<fake_push, { rows: number[] }>({
      unsubscribe_fn: async () => {
        /* no-op */
      },
    });
    // Push arrives before any snapshot:
    sub.push({ height: 1, rows: [7] });
    const r = await sub.result;
    expect(r).toBeInstanceOf(subscription_no_snapshot);
  });

  test("subsequent pushes don't re-resolve result", async () => {
    const sub = new subscription_impl<fake_push, { rows: number[] }>({
      unsubscribe_fn: async () => {
        /* no-op */
      },
    });
    sub.set_result({ rows: [] });
    sub.push({ height: 2, rows: [9] }); // first push
    sub.push({ height: 3, rows: [10] }); // another push
    const r = await sub.result;
    expect(r).toEqual({ rows: [] }); // still the snapshot, not no_snapshot
  });

  test("iterator yields pushes after result resolves", async () => {
    const sub = new subscription_impl<fake_push, { rows: number[] }>({
      unsubscribe_fn: async () => {
        /* no-op */
      },
    });
    const results: fake_push[] = [];
    let iterator_done = false;
    const consumer = (async () => {
      for await (const push of sub) {
        results.push(push);
      }
      iterator_done = true;
    })();
    sub.push({ height: 1, rows: [1] });
    sub.push({ height: 2, rows: [2] });
    await new Promise((r) => setTimeout(r, 5));
    expect(results.length).toBe(2);
    expect(results[0]?.rows).toEqual([1]);
    expect(results[1]?.rows).toEqual([2]);
    expect(iterator_done).toBe(false);
    // Closing the subscription by ending it should make the iterator stop.
    sub.end("end_of_test", "test ends");
    await consumer;
    expect(iterator_done).toBe(true);
  });

  test("end before result settles result as no_snapshot; iterator rejects with subscription_error", async () => {
    const sub = new subscription_impl<fake_push, { rows: number[] }>({
      unsubscribe_fn: async () => {
        /* no-op */
      },
    });
    sub.end("too_far_behind", "you missed too many");
    // The result Promise settles too (so callers don't hang), with
    // no_snapshot — the cause of the end is delivered through the iterator.
    const r = await sub.result;
    expect(r).toBeInstanceOf(subscription_no_snapshot);
    // And the iterator's `next()` rejects with the subscription_error so
    // for-await consumers get a proper error.
    const it = sub[Symbol.asyncIterator]();
    await expect(it.next()).rejects.toThrow(/too_far_behind/);
  });
});
