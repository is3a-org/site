import { Badge } from "@is3a/design-system/badge";
import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import {
  Check,
  Calendar,
  CalendarHeart,
  MessageCircle,
  CreditCard,
  User,
  Lock,
} from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";

import type { Subscription } from "@fragno-dev/stripe";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { MembershipPlans } from "~/components/membership-plans";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { getStripeFragment } from "~/fragno/stripe-durable-object";
import { getMembershipByPriceId } from "~/lib/memberships";
import { simpleAuthClient } from "~/lib/simple-auth-client";
import { stripeFragmentClient } from "~/lib/stripe-client";
import { cn } from "~/lib/utils";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/membership";
import {
  formatMembershipDate as formatDate,
  formatMembershipCancellationDate,
} from "./membership-billing";

interface StatusMeta {
  label: string;
  badgeColor: string;
  textColor: string;
  isHealthy: boolean;
  showPaymentWarning: boolean;
}

const STATUS_CONFIG = {
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
} satisfies Record<string, StatusMeta>;

const getStatusMeta = (status?: string, isScheduledToCancel?: boolean): StatusMeta => {
  if (isScheduledToCancel === true) {
    return {
      label: "Canceling",
      badgeColor: "bg-orange-300",
      textColor: "text-orange-800",
      isHealthy: false,
      showPaymentWarning: false,
    };
  }

  const knownStatus = Object.entries(STATUS_CONFIG).find(([statusName]) => statusName === status);
  if (knownStatus !== undefined) {
    return knownStatus[1];
  }

  return {
    label: status === undefined || status === "" ? "Unknown" : status,
    badgeColor: "bg-gray-400",
    textColor: "text-gray-800",
    isHealthy: false,
    showPaymentWarning: false,
  };
};

const describeStatus = ({
  status,
  isScheduledToCancel,
  cancelDate,
  renewalDate,
  trialEndDate,
}: {
  readonly status?: string;
  readonly isScheduledToCancel: boolean;
  readonly cancelDate?: string | number | Date | null;
  readonly renewalDate?: string | number | Date | null;
  readonly trialEndDate?: string | number | Date | null;
}): string => {
  if (isScheduledToCancel) {
    return `Your membership is scheduled to cancel on ${
      formatDate(cancelDate) ?? "the end of your billing period"
    }`;
  }

  switch (status ?? "") {
    case "trialing": {
      return trialEndDate !== undefined &&
        trialEndDate !== null &&
        trialEndDate !== "" &&
        trialEndDate !== 0
        ? `Trial ends on ${formatDate(trialEndDate)}`
        : "Your trial is active";
    }
    case "past_due": {
      return "Payment failed. Please update your payment method to continue your membership.";
    }
    case "unpaid": {
      return "Your subscription is unpaid and has been canceled. Please update your payment method.";
    }
    case "incomplete": {
      return "Your subscription setup is incomplete. Please complete the payment process.";
    }
    case "incomplete_expired": {
      return "Your subscription setup has expired. Please start a new subscription.";
    }
    case "active": {
      return renewalDate !== undefined &&
        renewalDate !== null &&
        renewalDate !== "" &&
        renewalDate !== 0
        ? `Renews automatically on ${formatDate(renewalDate)}`
        : "Your subscription is active";
    }
    case "canceled": {
      return "Your membership has been canceled and will not renew";
    }
    default: {
      return "Check your subscription status";
    }
  }
};

interface PaymentWarningConfig {
  title: string;
  message: string;
  variant: "destructive" | "default";
}

const getPaymentWarningConfig = (status?: string): PaymentWarningConfig | undefined => {
  switch (status ?? "") {
    case "past_due": {
      return {
        title: "⚠️ Payment Failed",
        message:
          "We couldn't process your payment. Please update your payment method to avoid losing access to your membership benefits.",
        variant: "destructive" as const,
      };
    }
    case "unpaid": {
      return {
        title: "❌ Subscription Unpaid",
        message:
          "Your subscription payment has failed permanently. Please update your payment method and restart your subscription.",
        variant: "destructive" as const,
      };
    }
    case "incomplete": {
      return {
        title: "⏳ Payment Incomplete",
        message:
          "Your subscription setup wasn't completed. Please finish the payment process to activate your membership.",
        variant: "default" as const,
      };
    }
    default: {
      return undefined;
    }
  }
};

const redirectToStripe = (response?: { readonly url?: string }): void => {
  if (response?.url !== undefined && response.url !== "") {
    globalThis.location.href = response.url;
  }
};

const ErrorAlert = ({ message }: { readonly message: string }): JSX.Element => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
    <p className="font-semibold">Error</p>
    <p className="text-sm">{message}</p>
  </div>
);

interface MembershipLoaderData {
  subscription: Subscription | null;
}

export async function loader({
  context,
  request,
}: Readonly<Route.LoaderArgs>): Promise<MembershipLoaderData> {
  const auth = createSimpleAuthServer(context.get(requestContext).pool);
  const response = await auth.callRoute("GET", "/me", {
    headers: request.headers,
  });

  if (response.type === "json") {
    const subscriptions = await getStripeFragment(
      context.get(requestContext).cloudflare.env,
    ).getSubscriptionsByReferenceId(response.data.user.id);
    // Get the first subscription (most apps only have one per customer)
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: The membership loader JSON includes subscription: null when Stripe has no subscriptions.
    const subscription = subscriptions.at(0) ?? null;
    return { subscription };
  }
  // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: The membership loader JSON includes subscription: null for an unauthenticated request.
  return { subscription: null };
}

export default function DashboardSubscribe({
  loaderData,
  actionData: _actionData,
  params: _params,
  matches: _matches,
  className,
  ...props
}: React.ComponentProps<"div"> & ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  const { subscription } = loaderData;

  // User info
  const { data: userData, loading: userLoading } = simpleAuthClient.useMe();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();

  const { mutate: changePassword, loading: changePasswordLoading } =
    simpleAuthClient.useChangePassword();

  const handleChangePassword = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setPasswordError(undefined);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    try {
      await changePassword({
        body: { newPassword },
      });
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error_) {
      setPasswordError(error_ instanceof Error ? error_.message : "Failed to change password");
    }
  };

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
  const membership = getMembershipByPriceId(subscription?.priceId);
  const isScheduledToCancel =
    subscription !== null && (subscription.cancelAtPeriodEnd || subscription.cancelAt !== null);
  const renewalDate = subscription?.currentPeriodEnd;
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
  const renewalLabel = status === "trialing" ? "Trial Ends" : "Renews On";
  const nextBillingLabel = isScheduledToCancel ? "Cancels On" : renewalLabel;
  const nextBillingDate =
    (isScheduledToCancel ? formatDate(cancelDate) : undefined) ??
    (status === "trialing" ? formatDate(trialEndDate) : undefined) ??
    formatDate(renewalDate) ??
    "N/A";
  const errors = [cancelError, error, createPortalError].filter((err) => err !== undefined);

  const handleUncancel = async (): Promise<void> => {
    if (subscription?.priceId === undefined || subscription.priceId === "") {
      return;
    }

    const response = await upgradeSubscription({
      body: {
        priceId: subscription.priceId,
        quantity: 1,
        successUrl: `${globalThis.location.origin}/dashboard/subscribe-confirm`,
        cancelUrl: `${globalThis.location.origin}/dashboard/membership`,
      },
    });
    redirectToStripe(response);
  };

  const handleCancel = async (): Promise<void> => {
    const resp = await cancelSubscription({
      body: {
        returnUrl: `${globalThis.location.origin}/dashboard/subscribe-confirm?sad=true`,
      },
    });
    redirectToStripe(resp);
  };

  const handleUpdateBilling = async (): Promise<void> => {
    const resp = await createPortal({
      body: {
        returnUrl: `${globalThis.location.origin}/dashboard/subscribe-confirm`,
      },
    });
    redirectToStripe(resp);
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Membership</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className={cn("flex flex-1 flex-col gap-8 p-4 lg:p-8", className)} {...props}>
        {/* Header Section */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {hasSubscription ? "Your Membership" : "Membership Plans"}
          </h2>
          {!hasSubscription && (
            <p className="max-w-3xl text-lg text-muted-foreground">
              We organize networking events at least once every three months. To cover the costs for
              this plus peripheral matters, we charge an annual membership fee. Feel free to join
              one of our events once prior to your membership registration.
            </p>
          )}
        </div>

        {errors.map((err, idx) => (
          <ErrorAlert key={`${err.message}-${idx}`} message={err.message} />
        ))}

        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!userLoading && userData !== undefined && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{userData.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">{userData.user.role}</p>
                </div>
              </div>
            )}
            {!userLoading && userData === undefined && (
              <p className="text-sm text-muted-foreground">Unable to load user information</p>
            )}

            {/* Change Password */}
            <hr />

            {passwordSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                Password changed successfully
              </div>
            )}

            {showPasswordForm ? (
              <form
                onSubmit={(event) => {
                  void handleChangePassword(event);
                }}
                className="space-y-4"
              >
                {passwordError !== undefined && passwordError !== "" && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                    }}
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                    }}
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={changePasswordLoading}>
                    {changePasswordLoading === true ? "Changing..." : "Save Password"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(undefined);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordForm(true);
                }}
              >
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            )}
          </CardContent>
        </Card>

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
                        {membership?.name === undefined || membership.name === ""
                          ? "Unknown"
                          : membership.name}{" "}
                        Membership
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
                      onClick={() => {
                        void handleUpdateBilling();
                      }}
                      disabled={createPortalLoading}
                      className="mt-3"
                      variant={paymentWarning.variant}
                    >
                      {createPortalLoading === true ? "Redirecting..." : "Update Payment Method"}
                    </Button>
                  </div>
                )}

                {/* Membership Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Billing</p>
                      <p className="text-sm text-muted-foreground">
                        {membership?.price === undefined || membership.price === ""
                          ? "N/A"
                          : membership.price}{" "}
                        per year
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{nextBillingLabel}</p>
                      <p className="text-sm text-muted-foreground">{nextBillingDate}</p>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Your Membership Includes:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        {membership?.id === "FULL" ? "4 Event Credits" : "1 Event Credit"} per year
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Access to WhatsApp Community</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarHeart className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        At least 4 Networking events throughout the year
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {statusMeta.isHealthy && !isScheduledToCancel && (
                  <div className="flex gap-2 border-t pt-4">
                    <Button
                      onClick={() => {
                        void handleUpdateBilling();
                      }}
                      disabled={createPortalLoading}
                    >
                      {createPortalLoading === true ? "Redirecting..." : "Update Billing Info"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        void handleCancel();
                      }}
                      disabled={cancelLoading}
                    >
                      {cancelLoading === true ? "Cancelling..." : "Cancel Membership"}
                    </Button>
                  </div>
                )}

                {/* Expired or Incomplete - Show restart option */}
                {(status === "incomplete_expired" || status === "canceled") && (
                  <div className="border-t pt-4">
                    <p className="mb-3 text-sm text-muted-foreground">
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
                  <p className="max-w-3xl text-muted-foreground">
                    Your membership is scheduled to cancel. You can renew your current plan or
                    choose a new plan after{" "}
                    {formatMembershipCancellationDate(cancelDate, renewalDate)}.
                  </p>
                  <Button
                    variant="default"
                    onClick={() => {
                      void handleUncancel();
                    }}
                    disabled={loading}
                  >
                    {loading === true ? "Renewing..." : "Renew Membership"}
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
                  <p className="max-w-3xl text-muted-foreground">
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
