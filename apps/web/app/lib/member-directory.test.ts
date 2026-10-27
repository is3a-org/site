import { describe, expect, it } from "vite-plus/test";

import type { UserMembershipWithHistory } from "~/db/repo/user";
import type { UserSubscriptionSummary } from "~/db/repo/user-memberships";

import {
  countByView,
  directoryStats,
  matchesSearch,
  sortEntries,
  toDirectoryEntry,
} from "./member-directory";

const subscription: UserSubscriptionSummary = {
  id: "sub_current",
  status: "active",
  priceId: "price_full",
  periodEnd: new Date("2027-01-01"),
  createdAt: new Date("2026-01-01"),
  cancelAtPeriodEnd: false,
  // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Stripe stores no cancellation date for a renewing subscription.
  cancelAt: null,
  // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Stripe stores no end date for a running subscription.
  endedAt: null,
};

function account(
  email: string,
  subscriptions: readonly UserSubscriptionSummary[],
): UserMembershipWithHistory {
  const current = subscriptions.at(0);
  return {
    id: email,
    email,
    role: "user",
    createdAt: new Date("2025-01-01"),
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: SQL left joins yield null for an absent Stripe link.
    stripeCustomerId: current === undefined ? null : `cus_${email}`,
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Membership summaries preserve nullable subscription columns.
    subscriptionId: current?.id ?? null,
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Membership summaries preserve nullable subscription columns.
    subscriptionStatus: current?.status ?? null,
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Membership summaries preserve nullable subscription columns.
    subscriptionStripePriceId: current?.priceId ?? null,
    subscriptions,
  };
}

describe("Member directory", () => {
  it("places accounts by their best subscription", () => {
    const entries = [
      account("active@x", [subscription]),
      account("trial@x", [{ ...subscription, status: "trialing" }]),
      account("late@x", [{ ...subscription, status: "past_due" }]),
      account("odd@x", [{ ...subscription, status: "something_new" }]),
      account("former@x", [{ ...subscription, status: "canceled" }]),
      account("abandoned@x", [{ ...subscription, status: "incomplete_expired" }]),
      account("never@x", []),
    ].map((member) => toDirectoryEntry(member));
    expect(entries.map((entry) => entry.standing)).toEqual([
      "active",
      "active",
      "attention",
      "attention",
      "lapsed",
      "none",
      "none",
    ]);
    expect(countByView(entries)).toEqual({ members: 2, attention: 2, lapsed: 1, all: 7 });
  });

  it("says when an active membership renews, ends or ended", () => {
    const renewing = toDirectoryEntry(account("a@x", [subscription]));
    expect(renewing.period).toEqual({ kind: "renews", date: subscription.periodEnd });
    expect(renewing.cancelling).toBe(false);

    const cancelAt = new Date("2026-06-01");
    const cancelling = toDirectoryEntry(account("b@x", [{ ...subscription, cancelAt }]));
    expect(cancelling.period).toEqual({ kind: "ends", date: cancelAt });
    expect(cancelling.cancelling).toBe(true);

    const atPeriodEnd = toDirectoryEntry(
      account("c@x", [{ ...subscription, cancelAtPeriodEnd: true }]),
    );
    expect(atPeriodEnd.period).toEqual({ kind: "ends", date: subscription.periodEnd });

    const endedAt = new Date("2026-03-01");
    const lapsed = toDirectoryEntry(
      account("d@x", [{ ...subscription, status: "canceled", endedAt }]),
    );
    expect(lapsed.period).toEqual({ kind: "ended", date: endedAt });
    expect(lapsed.cancelling).toBe(false);

    const unpaidCheckout = toDirectoryEntry(
      account("e@x", [{ ...subscription, status: "incomplete" }]),
    );
    expect(unpaidCheckout.period).toBeUndefined();
  });

  it("dates membership from the first subscription that was paid for", () => {
    const entry = toDirectoryEntry(
      account("a@x", [
        subscription,
        { ...subscription, id: "sub_old", status: "canceled", createdAt: new Date("2024-05-01") },
        {
          ...subscription,
          id: "sub_abandoned",
          status: "incomplete_expired",
          createdAt: new Date("2023-01-01"),
        },
      ]),
    );
    expect(entry.memberSince).toEqual(new Date("2024-05-01"));
    expect(toDirectoryEntry(account("b@x", [])).memberSince).toBeUndefined();
  });

  it("searches email, customer ID and subscription IDs", () => {
    const entry = toDirectoryEntry(
      account("Someone@Example.com", [{ ...subscription, id: "sub_ABC" }]),
    );
    expect(matchesSearch(entry, "someone@")).toBe(true);
    expect(matchesSearch(entry, "cus_someone")).toBe(true);
    expect(matchesSearch(entry, "sub_abc")).toBe(true);
    expect(matchesSearch(entry, "  ")).toBe(true);
    expect(matchesSearch(entry, "nobody")).toBe(false);
  });

  it("sorts by date with undated accounts last in either direction", () => {
    const entries = [
      account("none@x", []),
      account("late@x", [{ ...subscription, periodEnd: new Date("2027-06-01") }]),
      account("early@x", [{ ...subscription, periodEnd: new Date("2026-06-01") }]),
    ].map((member) => toDirectoryEntry(member));
    const emails = (order: "asc" | "desc"): string[] =>
      sortEntries(entries, { key: "renewal", order }).map((entry) => entry.account.email);
    expect(emails("asc")).toEqual(["early@x", "late@x", "none@x"]);
    expect(emails("desc")).toEqual(["late@x", "early@x", "none@x"]);
  });

  it("counts active members per plan and those cancelling", () => {
    const stats = directoryStats(
      [
        account("a@x", [subscription]),
        account("b@x", [{ ...subscription, priceId: "price_flex", cancelAtPeriodEnd: true }]),
        account("c@x", [{ ...subscription, status: "past_due" }]),
        account("d@x", []),
      ].map((member) => toDirectoryEntry(member)),
    );
    expect(stats.active).toBe(2);
    expect(stats.cancelling).toBe(1);
    expect(stats.attention).toBe(1);
    expect([...stats.byPriceId]).toEqual([
      ["price_full", 1],
      ["price_flex", 1],
    ]);
  });
});
