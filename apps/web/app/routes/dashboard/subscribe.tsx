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

type StatusMeta = {
  label: string;
  badgeColor: string;
  textColor: string;
  isHealthy: boolean;
  showPaymentWarning: boolean;
};

const STATUS_CONFIG: Record<string, StatusMeta> = {
  active: {
    label: "Active",
    badgeColor: "bg-green-600",
    textColor: "text-green-800",
    isHealthy: true,
    showPaymentWarning: false,
  },
  trialing: {
    label: "Trial",
    badgeColor: "bg-green-600",
    textColor: "text-green-800",
    isHealthy: true,
    showPaymentWarning: false,
  },
  past_due: {
    label: "Past Due",
    badgeColor: "bg-red-600",
    textColor: "text-red-800",
    isHealthy: false,
    showPaymentWarning: true,
  },
  unpaid: {
    label: "Unpaid",
    badgeColor: "bg-red-600",
    textColor: "text-red-800",
    isHealthy: false,
    showPaymentWarning: true,
  },
  incomplete: {
    label: "Incomplete",
    badgeColor: "bg-yellow-500",
    textColor: "text-yellow-800",
    isHealthy: false,
    showPaymentWarning: true,
  },
  incomplete_expired: {
    label: "Expired",
    badgeColor: "bg-gray-400",
    textColor: "text-gray-800",
    isHealthy: false,
    showPaymentWarning: false,
  },
  canceled: {
    label: "Canceled",
    badgeColor: "bg-gray-400",
    textColor: "text-gray-800",
    isHealthy: false,
    showPaymentWarning: false,
  },
};

const DISPLAY_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
};

const getStatusMeta = (status?: string, isScheduledToCancel?: boolean): StatusMeta => {
  if (isScheduledToCancel) {
    return {
      label: "Canceling",
      badgeColor: "bg-orange-300",
      textColor: "text-orange-800",
      isHealthy: false,
      showPaymentWarning: false,
    };
  }

  if (status && STATUS_CONFIG[status]) {
    return STATUS_CONFIG[status];
  }

  return {
    label: status || "Unknown",
    badgeColor: "bg-gray-400",
    textColor: "text-gray-800",
    isHealthy: false,
    showPaymentWarning: false,
  };
};

const formatDate = (date?: string | number | Date | null) => {
  if (!date) {
    return null;
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return parsedDate.toLocaleDateString("en-US", DISPLAY_DATE_FORMAT);
};

const describeStatus = ({
  status,
  isScheduledToCancel,
  cancelDate,
  renewalDate,
  trialEndDate,
}: {
  status?: string;
  isScheduledToCancel: boolean;
  cancelDate?: string | number | Date | null;
  renewalDate?: string | number | Date | null;
  trialEndDate?: string | number | Date | null;
}) => {
  if (isScheduledToCancel) {
    return `Your membership is scheduled to cancel on ${
      formatDate(cancelDate) ?? "the end of your billing period"
    }`;
  }

  switch (status) {
    case "trialing":
      return trialEndDate ? `Trial ends on ${formatDate(trialEndDate)}` : "Your trial is active";
    case "past_due":
      return "Payment failed. Please update your payment method to continue your membership.";
    case "unpaid":
      return "Your subscription is unpaid and has been canceled. Please update your payment method.";
    case "incomplete":
      return "Your subscription setup is incomplete. Please complete the payment process.";
    case "incomplete_expired":
      return "Your subscription setup has expired. Please start a new subscription.";
    case "active":
      return renewalDate
        ? `Renews automatically on ${formatDate(renewalDate)}`
        : "Your subscription is active";
    case "canceled":
      return "Your membership has been canceled and will not renew";
    default:
      return "Check your subscription status";
  }
};

const getPaymentWarningConfig = (status?: string) => {
  switch (status) {
    case "past_due":
      return {
        title: "⚠️ Payment Failed",
        message:
          "We couldn't process your payment. Please update your payment method to avoid losing access to your membership benefits.",
        variant: "destructive" as const,
      };
    case "unpaid":
      return {
        title: "❌ Subscription Unpaid",
        message:
          "Your subscription payment has failed permanently. Please update your payment method and restart your subscription.",
        variant: "destructive" as const,
      };
    case "incomplete":
      return {
        title: "⏳ Payment Incomplete",
        message:
          "Your subscription setup wasn't completed. Please finish the payment process to activate your membership.",
        variant: "default" as const,
      };
    default:
      return null;
  }
};

const redirectToStripe = (response?: { redirect?: boolean; url?: string }) => {
  if (response?.redirect && response.url) {
    window.location.href = response.url;
  }
};

const ErrorAlert = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
    <p className="font-semibold">Error</p>
    <p className="text-sm">{message}</p>
  </div>
);

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

  const status = subscription?.status;
  const hasSubscription = !!subscription;
  const membership = getMembershipByPriceId(subscription?.stripePriceId);
  const isScheduledToCancel = subscription?.cancelAtPeriodEnd || subscription?.cancelAt !== null;
  const renewalDate = subscription?.periodEnd;
  const cancelDate = subscription?.cancelAt;
  const trialEndDate = subscription?.trialEnd;
  const statusMeta = getStatusMeta(status, isScheduledToCancel);
  const statusDescription = describeStatus({
    status,
    isScheduledToCancel,
    cancelDate,
    renewalDate,
    trialEndDate,
  });
  const paymentWarning = getPaymentWarningConfig(status);
  const nextBillingLabel = isScheduledToCancel
    ? "Cancels On"
    : status === "trialing"
      ? "Trial Ends"
      : "Renews On";
  const nextBillingDate =
    (isScheduledToCancel ? formatDate(cancelDate) : null) ||
    (status === "trialing" ? formatDate(trialEndDate) : null) ||
    formatDate(renewalDate) ||
    "N/A";
  const errors = [cancelError, error, createPortalError].filter((err) => err != null);

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
    redirectToStripe(response);
  };

  const handleCancel = async () => {
    const resp = await cancelSubscription({
      body: {
        returnUrl: `${window.location.origin}/dashboard/subscribe-confirm?sad=true`,
      },
    });
    redirectToStripe(resp);
  };

  const handleUpdateBilling = async () => {
    const resp = await createPortal({
      body: {
        returnUrl: `${window.location.origin}/dashboard/subscribe-confirm`,
      },
    });
    redirectToStripe(resp);
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
            {hasSubscription ? "Your Membership" : "Membership Plans"}
          </h2>
          {import.meta.env.PROD && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                <strong>⚠️ Read-only Mode:</strong> The Stripe API key is currently read-only, so
                creating/updating/cancelling subscriptions will not work.
              </p>
            </div>
          )}

          {!hasSubscription && (
            <p className="text-muted-foreground max-w-3xl text-lg">
              We organize networking events at least once every three months. To cover the costs for
              this plus peripheral matters, we charge an annual membership fee. Feel free to join
              one of our events once prior to your membership registration.
            </p>
          )}
        </div>

        {errors.map((err, idx) => (
          <ErrorAlert key={`${err.message}-${idx}`} message={err.message} />
        ))}

        {/* Conditional Rendering: Subscription Status or Membership Plans */}
        {hasSubscription ? (
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
                        variant={statusMeta.isHealthy ? "default" : "secondary"}
                        className={statusMeta.badgeColor}
                      >
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <CardDescription className={statusMeta.textColor}>
                      {statusDescription}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Issue Warning */}
                {statusMeta.showPaymentWarning && paymentWarning && (
                  <div
                    className={`rounded-lg border p-4 ${
                      paymentWarning.variant === "destructive"
                        ? "border-red-300 bg-red-50"
                        : "border-yellow-300 bg-yellow-50"
                    }`}
                  >
                    <p
                      className={`mb-2 font-semibold ${
                        paymentWarning.variant === "destructive"
                          ? "text-red-900"
                          : "text-yellow-900"
                      }`}
                    >
                      {paymentWarning.title}
                    </p>
                    <p
                      className={`text-sm ${
                        paymentWarning.variant === "destructive"
                          ? "text-red-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {paymentWarning.message}
                    </p>
                    <Button
                      onClick={handleUpdateBilling}
                      disabled={createPortalLoading}
                      className="mt-3"
                      variant={paymentWarning.variant}
                    >
                      {createPortalLoading ? "Redirecting..." : "Update Payment Method"}
                    </Button>
                  </div>
                )}

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
                      <p className="text-sm font-medium">{nextBillingLabel}</p>
                      <p className="text-muted-foreground text-sm">{nextBillingDate}</p>
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
                {statusMeta.isHealthy && !isScheduledToCancel && (
                  <div className="flex gap-2 border-t pt-4">
                    <Button onClick={handleUpdateBilling} disabled={createPortalLoading}>
                      {createPortalLoading ? "Redirecting..." : "Update Billing Info"}
                    </Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={cancelLoading}>
                      {cancelLoading ? "Cancelling..." : "Cancel Membership"}
                    </Button>
                  </div>
                )}

                {/* Expired or Incomplete - Show restart option */}
                {(status === "incomplete_expired" || status === "canceled") && (
                  <div className="border-t pt-4">
                    <p className="text-muted-foreground mb-3 text-sm">
                      {status === "incomplete_expired"
                        ? "Your subscription setup has expired. You can start a new subscription below."
                        : "Your subscription has ended. You can subscribe again below."}
                    </p>
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

            {/* Show membership plans for expired, incomplete, or unpaid subscriptions */}
            {(status === "incomplete_expired" || status === "unpaid") && (
              <>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {status === "unpaid" ? "Restart Your Membership" : "Choose a Plan"}
                  </h3>
                  <p className="text-muted-foreground max-w-3xl">
                    {status === "unpaid"
                      ? "Your previous subscription could not be processed. Please select a plan below to restart your membership."
                      : "Select a membership plan to get started."}
                  </p>
                </div>
                <MembershipPlans />
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
