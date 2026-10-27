import { describe, expect, it } from "vite-plus/test";

import { resolveCustomerSyncState } from "./stripe-sync-state";

const link = { customerId: "cus_member", referenceId: "member" };
const hook = { id: "hook1", status: "completed", error: "" };

describe("Customer subscription sync evidence", () => {
  it("does not consider an application-only or conflicting fragment link synced", () => {
    expect(resolveCustomerSyncState(link, undefined, hook, true).status).toBe("unverified");
    expect(resolveCustomerSyncState(link, "another-user", hook, true).status).toBe("unverified");
  });
  it("accepts a completed hook even with zero subscriptions", () => {
    expect(resolveCustomerSyncState(link, "member", hook, false).status).toBe("synced");
  });
  it.each(["pending", "processing"])(
    "keeps %s hooks pending despite existing subscription rows",
    (status) => {
      expect(resolveCustomerSyncState(link, "member", { ...hook, status }, true).status).toBe(
        "pending",
      );
    },
  );
  it("shows failed hooks even when older subscription records exist", () => {
    expect(
      resolveCustomerSyncState(
        link,
        "member",
        { ...hook, status: "failed", error: "Stripe unavailable" },
        true,
      ),
    ).toMatchObject({ status: "error", error: "Stripe unavailable" });
  });
  it("uses imported records as historical evidence when completed hooks have expired", () => {
    expect(resolveCustomerSyncState(link, "member", undefined, true).status).toBe("synced");
    expect(resolveCustomerSyncState(link, "member", undefined, false).status).toBe("unverified");
  });
});
