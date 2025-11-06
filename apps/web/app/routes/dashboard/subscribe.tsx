import { cn } from "~/lib/utils";
import type { Route } from "./+types/subscribe";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { stripeFragmentClient } from "~/lib/stripe-client";
import { Check, Calendar, CalendarHeart, MessageCircle, CreditCard } from "lucide-react";
import { MembershipPlans } from "~/components/membership-plans";
import { getMembershipByPriceId } from "~/lib/memberships";

import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { createStripeServer } from "~/fragno/stripe-server";

export async function loader({ context, request }: Route.LoaderArgs) {
  const auth = createSimpleAuthServer(context.db);
  const session = await auth.services.getSession(request.headers);
  if (session) {
    const frag = createStripeServer(context.db);
    const subscription = await frag.services.getSubscriptionByReferenceId(session.userId);
    return { subscription };
  }
  return { subscription: null };
}

export default function DashboardSubscribe({
  loaderData,
  actionData,
  params,
  matches,
  className,
  ...props
}: React.ComponentProps<"div"> & Route.ComponentProps) {
  const { subscription } = loaderData;

  const {
    mutate: cancelSubscription,
    loading: cancelLoading,
    error: cancelError,
  } = stripeFragmentClient.cancelSubscription();

  const {
    mutate: upgradeSubscription,
    loading,
    error,
  } = stripeFragmentClient.upgradeSubscription();

  const {
    mutate: createPortal,
    loading: createPortalLoading,
    error: createPortalError,
  } = stripeFragmentClient.useBillingPortal();

  const hasActiveSubscription = subscription?.status === "active";
  const membership = getMembershipByPriceId(subscription?.stripePriceId);
  const isActive = subscription?.status === "active";
  const isCanceled = subscription?.status === "canceled";
  const isScheduledToCancel = subscription?.cancelAtPeriodEnd || subscription?.cancelAt !== null;
  const renewalDate = subscription?.periodEnd;
  const cancelDate = subscription?.cancelAt;

  const handleUncancel = async () => {
    if (!subscription?.stripePriceId) {
      return;
    }

    const response = await upgradeSubscription({
      body: {
        priceId: subscription.stripePriceId,
        quantity: 1,
        successUrl: `${window.location.origin}/dashboard/subscribe-confirm`,
        cancelUrl: `${window.location.origin}/dashboard/subscribe`,
      },
    });
    if (response?.redirect) {
      window.location.href = response.url;
    }
  };

  const handleCancel = async () => {
    const resp = await cancelSubscription({
      body: {
        returnUrl: `${window.location.origin}/dashboard/subscribe-confirm?sad=true`,
      },
    });
    if (resp?.redirect) {
      window.location.href = resp.url;
    }
  };

  const handleUpdateBilling = async () => {
    const resp = await createPortal({
      body: {
        returnUrl: `${window.location.origin}/dashboard/subscribe-confirm`,
      },
    });
    if (resp?.redirect) {
      window.location.href = resp.url;
    }
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Subscribe</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className={cn("flex flex-1 flex-col gap-8 p-4 lg:p-8", className)} {...props}>
        {/* Header Section */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {hasActiveSubscription ? "Your Membership" : "Membership Plans"}
          </h2>
          {import.meta.env.PROD && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                <strong>⚠️ Read-only Mode:</strong> The Stripe API key is currently read-only, so
                creating/updating/cancelling subscriptions will not work.
              </p>
            </div>
          )}

          {!hasActiveSubscription && (
            <p className="text-muted-foreground max-w-3xl text-lg">
              We organize networking events at least once every three months. To cover the costs for
              this plus peripheral matters, we charge an annual membership fee. Feel free to join
              one of our events once prior to your membership registration.
            </p>
          )}
        </div>

        {cancelError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{cancelError.message}</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {createPortalError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{createPortalError.message}</p>
          </div>
        )}

        {/* Conditional Rendering: Subscription Status or Membership Plans */}
        {hasActiveSubscription && subscription ? (
          <div className="space-y-8">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl">
                        {membership?.name || "Unknown"} Membership
                      </CardTitle>
                      <Badge
                        variant={isActive && !isScheduledToCancel ? "default" : "secondary"}
                        className={
                          isActive && !isScheduledToCancel
                            ? "bg-green-600"
                            : isScheduledToCancel
                              ? "bg-orange-300"
                              : "bg-yellow-300"
                        }
                      >
                        {isScheduledToCancel
                          ? "Canceling"
                          : isActive
                            ? "Active"
                            : isCanceled
                              ? "Canceled"
                              : subscription.status}
                      </Badge>
                    </div>
                    <CardDescription
                      className={
                        isActive && !isScheduledToCancel
                          ? "text-green-800"
                          : isScheduledToCancel
                            ? "text-orange-800"
                            : "text-yellow-800"
                      }
                    >
                      {isScheduledToCancel
                        ? `Your membership is scheduled to cancel on ${cancelDate ? new Date(cancelDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "the end of your billing period"}`
                        : isActive && renewalDate
                          ? `Renews automatically on ${new Date(renewalDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                          : isCanceled
                            ? "Your membership has been canceled and will not renew"
                            : "Check your subscription status"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Membership Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <CreditCard className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Billing</p>
                      <p className="text-muted-foreground text-sm">
                        {membership?.price || "N/A"} per year
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Calendar className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isScheduledToCancel ? "Cancels On" : "Renews On"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {isScheduledToCancel && cancelDate
                          ? new Date(cancelDate).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : renewalDate
                            ? new Date(renewalDate).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Your Membership Includes:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="text-primary h-4 w-4" />
                      <span className="text-sm">
                        {membership?.id === "FULL" ? "4 Event Credits" : "1 Event Credit"} per year
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="text-primary h-4 w-4" />
                      <span className="text-sm">Access to WhatsApp Community</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarHeart className="text-primary h-4 w-4" />
                      <span className="text-sm">
                        At least 4 Networking events throughout the year
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}

                {isActive && !isScheduledToCancel && (
                  <div className="flex gap-2 border-t pt-4">
                    <Button onClick={handleUpdateBilling} disabled={createPortalLoading}>
                      {createPortalLoading ? "Redirecting..." : "Update Billing Info"}
                    </Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={cancelLoading}>
                      {cancelLoading ? "Cancelling..." : "Cancel Membership"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Show membership plans when scheduled to cancel */}
            {isScheduledToCancel && (
              <>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold tracking-tight">Renew Your Membership</h3>
                  <p className="text-muted-foreground max-w-3xl">
                    Your membership is scheduled to cancel. You can renew your current plan or
                    choose a new plan after{" "}
                    {new Date(cancelDate!).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    .
                  </p>
                  <Button variant="default" onClick={handleUncancel} disabled={loading}>
                    {loading ? "Renewing..." : "Renew Membership"}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <MembershipPlans />
        )}
      </div>
    </>
  );
}
