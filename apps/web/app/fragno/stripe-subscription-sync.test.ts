import { describe, expect, it, vi } from "vite-plus/test";

import { DatabaseConstraintError } from "@fragno-dev/db";

import { runSubscriptionSync } from "./stripe-subscription-sync";

const collision = new DatabaseConstraintError({
  kind: "unique",
  table: "subscription",
  constraint: "subscription_id_unique",
  columns: ["id"],
});

describe("Immediate subscription sync concurrency", () => {
  it("re-reads after a concurrent subscription-ID insertion instead of failing the caller", async () => {
    const sync = vi.fn<() => Promise<void>>().mockRejectedValueOnce(collision).mockResolvedValue();
    await runSubscriptionSync(sync);
    expect(sync).toHaveBeenCalledTimes(2);
  });
  it("does not retry or suppress unrelated database constraints", async () => {
    const conflict = new DatabaseConstraintError({
      kind: "unique",
      table: "customer",
      constraint: "idx_customer_reference_id",
    });
    const sync = vi.fn<() => Promise<void>>().mockRejectedValue(conflict);
    await expect(runSubscriptionSync(sync)).rejects.toBe(conflict);
    expect(sync).toHaveBeenCalledTimes(1);
  });
  it("does not turn persistent subscription conflicts into false success", async () => {
    const sync = vi.fn<() => Promise<void>>().mockRejectedValue(collision);
    await expect(runSubscriptionSync(sync)).rejects.toBe(collision);
    expect(sync).toHaveBeenCalledTimes(2);
  });
  it("allows two racing writers to converge on one subscription record", async () => {
    let stored = false;
    let calls = 0;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const sync = async (): Promise<void> => {
      const existedAtRead = stored;
      calls++;
      if (calls <= 2) {
        if (calls === 2) {
          release?.();
        }
        await gate;
      }
      if (!existedAtRead && stored) {
        throw collision;
      }
      stored = true;
    };
    await Promise.all([runSubscriptionSync(sync), runSubscriptionSync(sync)]);
    expect(stored).toBe(true);
    expect(calls).toBe(3);
  });

  it("runs a healthy sync exactly once", async () => {
    const sync = vi.fn<() => Promise<void>>().mockResolvedValue();
    await runSubscriptionSync(sync);
    expect(sync).toHaveBeenCalledTimes(1);
  });
});
