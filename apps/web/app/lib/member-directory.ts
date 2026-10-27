import type { UserMembershipWithHistory } from "~/db/repo/user";
import type { UserSubscriptionSummary } from "~/db/repo/user-memberships";

/** Where an account stands as a member, derived from its primary subscription. */
export type MemberStanding = "active" | "attention" | "lapsed" | "none";

/** The directory tabs. "members" lists active members; "all" lists every account. */
export type DirectoryView = "members" | "attention" | "lapsed" | "all";

export type DirectorySortKey = "email" | "renewal" | "memberSince";

export interface DirectorySort {
  readonly key: DirectorySortKey;
  readonly order: "asc" | "desc";
}

/** What the current billing period means for this account, for the "Renews / ends" column. */
export interface MemberPeriod {
  readonly kind: "renews" | "ends" | "ended";
  readonly date: Date;
}

export interface DirectoryEntry {
  readonly account: Readonly<UserMembershipWithHistory>;
  readonly standing: MemberStanding;
  readonly current: UserSubscriptionSummary | undefined;
  readonly period: MemberPeriod | undefined;
  readonly memberSince: Date | undefined;
  readonly cancelling: boolean;
}

/** Accounts per directory tab. */
export interface ViewCounts {
  readonly members: number;
  readonly attention: number;
  readonly lapsed: number;
  readonly all: number;
}

export interface DirectoryStats {
  readonly active: number;
  readonly cancelling: number;
  readonly attention: number;
  readonly byPriceId: ReadonlyMap<string, number>;
}

const standingByStatus = new Map<string, MemberStanding>([
  ["active", "active"],
  ["trialing", "active"],
  ["past_due", "attention"],
  ["unpaid", "attention"],
  ["incomplete", "attention"],
  ["paused", "attention"],
  ["canceled", "lapsed"],
  // Expired checkouts were never paid, so the account was never a member.
  ["incomplete_expired", "none"],
]);

const neverPaid = new Set(["incomplete", "incomplete_expired"]);

// Unknown Stripe statuses surface under "Needs attention" rather than disappear.
function standingOf(subscription: UserSubscriptionSummary): MemberStanding {
  return standingByStatus.get(subscription.status) ?? "attention";
}

/** An active subscription that Stripe will not renew. */
export function isCancelling(subscription: UserSubscriptionSummary): boolean {
  return (
    standingOf(subscription) === "active" &&
    (subscription.cancelAtPeriodEnd || subscription.cancelAt !== null)
  );
}

export function subscriptionPeriod(
  subscription: UserSubscriptionSummary,
): MemberPeriod | undefined {
  // A checkout that was never paid has no meaningful billing period.
  const standing = standingOf(subscription);
  if (standing === "none" || neverPaid.has(subscription.status)) {
    return undefined;
  }
  if (standing === "lapsed") {
    return { kind: "ended", date: subscription.endedAt ?? subscription.periodEnd };
  }
  if (isCancelling(subscription)) {
    return { kind: "ends", date: subscription.cancelAt ?? subscription.periodEnd };
  }
  return { kind: standing === "active" ? "renews" : "ends", date: subscription.periodEnd };
}

/** Subscriptions are already sorted best-first, so the first one decides the standing. */
export function toDirectoryEntry(account: Readonly<UserMembershipWithHistory>): DirectoryEntry {
  const current = account.subscriptions.at(0);
  const started = account.subscriptions
    .filter((subscription) => !neverPaid.has(subscription.status))
    .map((subscription) => subscription.createdAt.getTime());
  return {
    account,
    standing: current === undefined ? "none" : standingOf(current),
    current,
    period: current === undefined ? undefined : subscriptionPeriod(current),
    memberSince: started.length === 0 ? undefined : new Date(Math.min(...started)),
    cancelling: current !== undefined && isCancelling(current),
  };
}

const standingByView = {
  members: "active",
  attention: "attention",
  lapsed: "lapsed",
} as const satisfies Partial<Record<DirectoryView, MemberStanding>>;

export function isInView(entry: DirectoryEntry, view: DirectoryView): boolean {
  return view === "all" || entry.standing === standingByView[view];
}

/** Matches email, Stripe customer ID or any subscription ID, ignoring case. */
export function matchesSearch(entry: DirectoryEntry, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === "") {
    return true;
  }
  const { account } = entry;
  return [
    account.email,
    account.stripeCustomerId ?? "",
    ...account.subscriptions.map((subscription) => subscription.id),
  ].some((haystack) => haystack.toLowerCase().includes(needle));
}

function sortValue(entry: DirectoryEntry, key: DirectorySortKey): string | number | undefined {
  if (key === "email") {
    return entry.account.email.toLowerCase();
  }
  return (key === "renewal" ? entry.period?.date : entry.memberSince)?.getTime();
}

/** Sorts by the chosen column; accounts without a value always go last, then fall back to email. */
export function sortEntries(
  entries: readonly DirectoryEntry[],
  sort: DirectorySort,
): DirectoryEntry[] {
  const direction = sort.order === "asc" ? 1 : -1;
  return entries.toSorted((a, b) => {
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);
    if (left === undefined || right === undefined) {
      if (left !== right) {
        return left === undefined ? 1 : -1;
      }
    } else if (left !== right) {
      return (left < right ? -1 : 1) * direction;
    }
    return a.account.email.localeCompare(b.account.email);
  });
}

export function countByView(entries: readonly DirectoryEntry[]): ViewCounts {
  return {
    members: entries.filter((entry) => isInView(entry, "members")).length,
    attention: entries.filter((entry) => isInView(entry, "attention")).length,
    lapsed: entries.filter((entry) => isInView(entry, "lapsed")).length,
    all: entries.length,
  };
}

export function directoryStats(entries: readonly DirectoryEntry[]): DirectoryStats {
  const byPriceId = new Map<string, number>();
  let active = 0;
  let cancelling = 0;
  let attention = 0;
  for (const entry of entries) {
    if (entry.standing === "attention") {
      attention += 1;
    }
    if (entry.standing !== "active" || entry.current === undefined) {
      continue;
    }
    active += 1;
    if (entry.cancelling) {
      cancelling += 1;
    }
    const { priceId } = entry.current;
    byPriceId.set(priceId, (byPriceId.get(priceId) ?? 0) + 1);
  }
  return { active, cancelling, attention, byPriceId };
}
