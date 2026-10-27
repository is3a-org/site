import { Button } from "@is3a/design-system/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@is3a/design-system/sheet";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";

import {
  PeriodText,
  PlanBadge,
  SubscriptionStatusBadge,
  planName,
} from "~/components/member-badges";
import { formatCalendarDate } from "~/lib/date-utils";
import { subscriptionPeriod, type DirectoryEntry } from "~/lib/member-directory";

interface MemberDetailsSheetProps {
  readonly entry: DirectoryEntry | undefined;
  readonly stripeDashboardUrl: string;
  readonly onOpenChange: (open: boolean) => void;
}

export function MemberDetailsSheet({
  entry,
  stripeDashboardUrl,
  onOpenChange,
}: MemberDetailsSheetProps): JSX.Element {
  return (
    <Sheet open={entry !== undefined} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(32rem,90vw)]">
        {entry && <MemberDetails entry={entry} stripeDashboardUrl={stripeDashboardUrl} />}
      </SheetContent>
    </Sheet>
  );
}

function MemberDetails({
  entry,
  stripeDashboardUrl,
}: Readonly<{ entry: DirectoryEntry; stripeDashboardUrl: string }>): JSX.Element {
  const { account, current, period, memberSince } = entry;
  return (
    <>
      <SheetHeader>
        <SheetTitle className="break-all">{account.email}</SheetTitle>
        <SheetDescription>
          Account created {formatCalendarDate(account.createdAt)}
          {account.role === "admin" && " · Admin"}
        </SheetDescription>
      </SheetHeader>

      <Section title="Membership">
        {current === undefined || entry.standing === "none" ? (
          <p className="text-sm text-muted-foreground">No membership.</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="flex items-center gap-2">
              <PlanBadge priceId={current.priceId} />
              <SubscriptionStatusBadge subscription={current} />
            </dd>
            {period && (
              <>
                <dt className="text-muted-foreground">Period</dt>
                <dd>
                  <PeriodText period={period} />
                </dd>
              </>
            )}
            {memberSince && (
              <>
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="tabular-nums">{formatCalendarDate(memberSince)}</dd>
              </>
            )}
          </dl>
        )}
      </Section>

      <Section title="Stripe customer">
        {account.stripeCustomerId === null || account.stripeCustomerId === "" ? (
          <p className="text-sm text-muted-foreground">Not linked to a Stripe customer.</p>
        ) : (
          <StripeId
            id={account.stripeCustomerId}
            href={`${stripeDashboardUrl}/customers/${account.stripeCustomerId}`}
          />
        )}
      </Section>

      {account.subscriptions.length > 0 && (
        <Section title={`Subscription history (${account.subscriptions.length})`}>
          <ol className="flex flex-col divide-y divide-border">
            {account.subscriptions.map((subscription) => {
              const subscriptionEnd = subscriptionPeriod(subscription);
              return (
                <li key={subscription.id} className="flex flex-col gap-1.5 py-3 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{planName(subscription.priceId)}</span>
                    <SubscriptionStatusBadge subscription={subscription} />
                  </div>
                  <p className="text-sm tabular-nums">
                    <span className="text-muted-foreground">Started </span>
                    {formatCalendarDate(subscription.createdAt)}
                    {subscriptionEnd && (
                      <>
                        <span className="text-muted-foreground"> · </span>
                        <PeriodText period={subscriptionEnd} />
                      </>
                    )}
                  </p>
                  <StripeId
                    id={subscription.id}
                    href={`${stripeDashboardUrl}/subscriptions/${subscription.id}`}
                  />
                </li>
              );
            })}
          </ol>
        </Section>
      )}
    </>
  );
}

function Section({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>): JSX.Element {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold font-display tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StripeId({ id, href }: Readonly<{ id: string; href: string }>): JSX.Element {
  return (
    <div className="flex items-center gap-1">
      <code className="min-w-0 truncate font-mono text-xs text-muted-foreground">{id}</code>
      <CopyButton value={id} label={`Copy ${id}`} />
      <Button
        variant="ghost"
        size="icon"
        render={<a href={href} target="_blank" rel="noreferrer" aria-label="Open in Stripe" />}
        nativeButton={false}
        title="Open in Stripe"
      >
        <ExternalLink />
      </Button>
    </div>
  );
}

function CopyButton({ value, label }: Readonly<{ value: string; label: string }>): JSX.Element {
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={copied ? "Copied" : "Copy"}
      onClick={() => {
        void copy();
      }}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}
