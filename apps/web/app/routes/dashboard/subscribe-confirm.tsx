import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { CheckCircle2, XCircle, Loader2, HeartCrack } from "lucide-react";
import type { JSX } from "react";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { getStripeFragment } from "~/fragno/stripe-durable-object";
import { cn } from "~/lib/utils";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/subscribe-confirm";

interface SubscriptionConfirmationData {
  status: "error" | "success";
  message: string;
}

export async function loader({
  context,
  request,
}: Readonly<Route.LoaderArgs>): Promise<SubscriptionConfirmationData> {
  const auth = createSimpleAuthServer(context.get(requestContext).pool);
  const response = await auth.callRoute("GET", "/me", {
    headers: request.headers,
  });

  if (response.type !== "json") {
    console.error("No session found");
    return { status: "error", message: "Could not retrieve data for user" };
  }

  await getStripeFragment(context.get(requestContext).cloudflare.env).syncSubscriptions(
    response.data.user.id,
  );
  return { status: "success", message: "Subscription status up-to-date" };
}

export default function DashboardSubscribeConfirm({
  loaderData,
  actionData: _actionData,
  params: _params,
  matches: _matches,
  className,
  ...props
}: React.ComponentProps<"div"> & ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  const { status, message } = loaderData;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isSad = searchParams.get("sad") === "true";

  useEffect((): (() => void) | undefined => {
    if (status === "success") {
      const timer = setTimeout(() => {
        void navigate("/dashboard/membership");
      }, 2000);
      return (): void => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [status, navigate]);

  const successTitle = isSad ? "Successfully Cancelled" : "Success!";
  const successMessage = isSad
    ? "We're sad to see you go. Your subscription has been cancelled."
    : message;

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Subscription Confirmation</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className={cn("flex flex-1 items-center justify-center p-8", className)} {...props}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              {status === "success" ? (
                isSad ? (
                  <HeartCrack className="h-16 w-16 text-orange-600" />
                ) : (
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                )
              ) : (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === "success" ? successTitle : "Error"}
            </CardTitle>
            <CardDescription className="text-base">
              {status === "success" ? successMessage : message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === "success" ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting...</span>
              </div>
            ) : (
              <Button
                onClick={() => {
                  void navigate("/dashboard/membership");
                }}
                className="w-full"
              >
                Back to profile
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
