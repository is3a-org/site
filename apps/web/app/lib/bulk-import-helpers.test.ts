import { describe, expect, it } from "vite-plus/test";

import type { ImportCustomer, ImportUser } from "./bulk-import";
import {
  canImportPlan,
  matchStripeCustomerToUser,
  planCustomerImport,
  validateStripeCustomer,
} from "./bulk-import-helpers";

const customer: ImportCustomer = { id: "cus_example", email: " Member@Example.COM ", created: 1 };
const user: ImportUser = {
  id: "member",
  email: "member@example.com",
  stripeCustomerId: "cus_example",
};

// oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: An existing account can have no Stripe link.
const unlinkedUser: ImportUser = { ...user, stripeCustomerId: null };

describe("Stripe import planning", () => {
  it("matches customer IDs before normalized email, including changed login addresses", () => {
    const changedEmail = { ...user, email: "different@example.com" };
    expect(matchStripeCustomerToUser(customer, [changedEmail])).toMatchObject({
      matchedUser: changedEmail,
      matchType: "stripeCustomerId",
    });
    expect(matchStripeCustomerToUser(customer, [unlinkedUser])).toMatchObject({
      matchType: "email",
      hasConflict: false,
    });
  });

  it("marks conflicting account links for review instead of silently overwriting them", () => {
    const plan = planCustomerImport(customer, [{ ...user, stripeCustomerId: "cus_other" }], []);
    expect(plan.action).toBe("conflict");
    expect(canImportPlan(plan)).toBe(false);
  });

  it("requires sync evidence rather than treating a link as already synced", () => {
    expect(planCustomerImport(customer, [user], []).action).toBe("retry");
    expect(
      planCustomerImport(customer, [user], [{ customerId: customer.id, status: "pending" }]).action,
    ).toBe("pending");
    const synced = planCustomerImport(
      customer,
      [user],
      [{ customerId: customer.id, status: "synced" }],
    );
    expect(synced.action).toBe("synced");
    expect(canImportPlan(synced)).toBe(false);
  });

  it("offers linking an existing account separately from creating a new one", () => {
    expect(planCustomerImport(customer, [unlinkedUser], []).action).toBe("link");
    expect(planCustomerImport(customer, [], []).action).toBe("create");
  });

  it.each(["", "missing-at", "a@", "@example.com"])(
    "rejects invalid signup emails: %s",
    (email) => {
      expect(validateStripeCustomer({ ...customer, email }).valid).toBe(false);
      expect(planCustomerImport({ ...customer, email }, [], []).action).toBe("invalid");
    },
  );
});
