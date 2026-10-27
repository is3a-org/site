import { Badge } from "@is3a/design-system/badge";
import type { JSX } from "react";

import type { UserSubscriptionSummary } from "~/db/repo/user-memberships";
import { formatCalendarDate } from "~/lib/date-utils";
import { isCancelling, type MemberPeriod } from "~/lib/member-directory";
import { getMembershipByPriceId } from "~/lib/memberships";

type BadgeVariant = "success" | "warning" | "destructive" | "secondary";

const statusBadges = new Map<string, { label: string; variant: BadgeVariant }>([
  ["active", { label: "Active", variant: "success" }],
  ["trialing", { label: "Trial", variant: "success" }],
  ["past_due", { label: "Past due", variant: "destructive" }],
  ["unpaid", { label: "Unpaid", variant: "destructive" }],
  ["incomplete", { label: "Incomplete", variant: "warning" }],
  ["paused", { label: "Paused", variant: "warning" }],
  ["canceled", { label: "Canceled", variant: "secondary" }],
  ["incomplete_expired", { label: "Expired", variant: "secondary" }],
]);

export function SubscriptionStatusBadge({
  subscription,
}: Readonly<{ subscription: UserSubscriptionSummary }>): JSX.Element {
  if (isCancelling(subscription)) {
    return <Badge variant="warning">Cancelling</Badge>;
  }
  const badge = statusBadges.get(subscription.status);
  return badge === undefined ? (
    <Badge variant="outline">{subscription.status}</Badge>
  ) : (
    <Badge variant={badge.variant}>{badge.label}</Badge>
  );
}

export function planName(priceId: string): string {
  return getMembershipByPriceId(priceId)?.name ?? "Unknown plan";
}

export function PlanBadge({ priceId }: Readonly<{ priceId: string }>): JSX.Element {
  return (
    <Badge variant="outline" title={priceId}>
      {planName(priceId)}
    </Badge>
  );
}

const periodLabels = { renews: "Renews", ends: "Ends", ended: "Ended" };

export function PeriodText({ period }: Readonly<{ period: MemberPeriod }>): JSX.Element {
  return (
    <span className="tabular-nums">
      <span className="text-muted-foreground">{periodLabels[period.kind]} </span>
      {formatCalendarDate(period.date)}
    </span>
  );
}
