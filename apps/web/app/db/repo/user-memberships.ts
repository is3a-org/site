import type { UserMembershipWithHistory } from "./user";

export interface MembershipRow extends Omit<UserMembershipWithHistory, "subscriptions"> {
  readonly subscriptionPeriodEnd: Date | null;
  readonly subscriptionCreatedAt: Date | null;
}

export interface UserSubscriptionSummary {
  readonly id: string;
  readonly status: string;
  readonly priceId: string;
  readonly periodEnd: Date;
  readonly createdAt: Date;
}

const statusOrder = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
  "canceled",
  "incomplete_expired",
];

function rank(status: string): number {
  const index = statusOrder.indexOf(status);
  return index === -1 ? statusOrder.length : index;
}

function compareSubscriptions(a: UserSubscriptionSummary, b: UserSubscriptionSummary): number {
  return (
    rank(a.status) - rank(b.status) ||
    b.periodEnd.getTime() - a.periodEnd.getTime() ||
    b.createdAt.getTime() - a.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

/** Preserve all subscription history, but return one deterministic summary per account. */
export function summarizeUserMemberships(
  rows: readonly MembershipRow[],
): UserMembershipWithHistory[] {
  const users = new Map<string, UserMembershipWithHistory>();
  for (const row of rows) {
    const previous = users.get(row.id);
    const subscriptions = [...(previous?.subscriptions ?? [])];
    if (
      row.subscriptionId !== null &&
      row.subscriptionStatus !== null &&
      row.subscriptionStripePriceId !== null &&
      row.subscriptionPeriodEnd &&
      row.subscriptionCreatedAt
    ) {
      subscriptions.push({
        id: row.subscriptionId,
        status: row.subscriptionStatus,
        priceId: row.subscriptionStripePriceId,
        periodEnd: row.subscriptionPeriodEnd,
        createdAt: row.subscriptionCreatedAt,
      });
    }
    const sorted = subscriptions.toSorted(compareSubscriptions);
    const primary = sorted.at(0);
    users.set(row.id, {
      id: row.id,
      email: row.email,
      createdAt: row.createdAt,
      stripeCustomerId: row.stripeCustomerId,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Membership summaries preserve nullable subscription columns.
      subscriptionId: primary?.id ?? null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Membership summaries preserve nullable subscription columns.
      subscriptionStatus: primary?.status ?? null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Membership summaries preserve nullable subscription columns.
      subscriptionStripePriceId: primary?.priceId ?? null,
      subscriptions: sorted,
    });
  }
  return [...users.values()];
}
