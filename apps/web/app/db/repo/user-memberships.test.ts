import { describe, expect, it } from "vite-plus/test";

import { summarizeUserMemberships, type MembershipRow } from "./user-memberships";

const active: MembershipRow = {
  id: "member",
  email: "member@example.com",
  createdAt: new Date("2025-01-01"),
  stripeCustomerId: "cus_member",
  subscriptionId: "sub_current",
  subscriptionStatus: "active",
  subscriptionStripePriceId: "price_full",
  subscriptionPeriodEnd: new Date("2027-01-01"),
  subscriptionCreatedAt: new Date("2026-01-01"),
};

describe("Member account summaries", () => {
  it("counts one account with full history rather than two subscription rows", () => {
    const canceled = { ...active, subscriptionId: "sub_old", subscriptionStatus: "canceled" };
    const members = summarizeUserMemberships([canceled, active]);
    expect(members).toHaveLength(1);
    expect(members[0].subscriptionId).toBe("sub_current");
    expect(members[0].subscriptions.map((subscription) => subscription.id)).toEqual([
      "sub_current",
      "sub_old",
    ]);
    expect(summarizeUserMemberships([active, canceled])).toEqual(members);
  });
  it("breaks equal-status ties by period, creation time and subscription ID", () => {
    const earlier = {
      ...active,
      subscriptionId: "sub_earlier",
      subscriptionPeriodEnd: new Date("2026-01-01"),
    };
    expect(summarizeUserMemberships([earlier, active])[0].subscriptionId).toBe("sub_current");
  });
  it("keeps accounts with no subscription and preserves their nullable fields", () => {
    const noSubscription: MembershipRow = {
      ...active,
      id: "unlinked",
      email: "unlinked@example.com",
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: SQL left joins yield null for an absent Stripe link.
      stripeCustomerId: null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: SQL left joins yield null for an absent subscription.
      subscriptionId: null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: SQL left joins yield null for an absent subscription status.
      subscriptionStatus: null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: SQL left joins yield null for an absent subscription price.
      subscriptionStripePriceId: null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: SQL left joins yield null for an absent billing period.
      subscriptionPeriodEnd: null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: SQL left joins yield null for an absent subscription timestamp.
      subscriptionCreatedAt: null,
    };
    const members = summarizeUserMemberships([active, noSubscription]);
    expect(members).toHaveLength(2);
    expect(members[1].subscriptionId).toBeNull();
    expect(members[1].subscriptions).toEqual([]);
  });
});
