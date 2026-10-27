import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import { Upload } from "lucide-react";
import type { JSX } from "react";
import { Link } from "react-router";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { StripeCustomersTable } from "~/components/stripe-customers-table";
import { UserRepo } from "~/db/repo/user";
import { requireAdmin } from "~/fragno/admin-auth.server";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { readFormText } from "~/fragno/request-form";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { getStripeFragment, linkStripeCustomer } from "~/fragno/stripe-durable-object";
import { cn } from "~/lib/utils";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/stripe";

interface StripeCustomersLoaderData {
  users: Awaited<ReturnType<UserRepo["getAllUsers"]>>;
}

type StripeCustomerActionResult =
  | { success: false; error: string }
  | { success: true; userId: string }
  | {
      success: true;
      user: NonNullable<Awaited<ReturnType<UserRepo["getUserByEmail"]>>>;
      matchType: "stripeCustomerId" | "email";
    }
  | { success: true; user: null; matchType: null };

export async function loader({
  context,
}: Readonly<Route.LoaderArgs>): Promise<StripeCustomersLoaderData> {
  const userRepo = new UserRepo(context.get(requestContext).db);
  const users = await userRepo.getAllUsers();
  return { users };
}

export async function action({
  request,
  context,
}: Readonly<Route.ActionArgs>): Promise<StripeCustomerActionResult> {
  await requireAdmin(request, context.get(requestContext).pool);
  const formData = await request.formData();
  const intent = readFormText(formData, "intent") ?? "";

  if (intent === "sync-subscription") {
    const stripeCustomerId = readFormText(formData, "stripeCustomerId") ?? "";
    const userId = readFormText(formData, "userId");
    const createNewUser = formData.get("createNewUser") === "true";
    const newUserEmail = readFormText(formData, "newUserEmail");

    const userRepo = new UserRepo(context.get(requestContext).db);
    const auth = createSimpleAuthServer(context.get(requestContext).pool);

    try {
      let targetUserId: string;

      if (createNewUser && newUserEmail !== undefined && newUserEmail !== "") {
        // Create new user with auto-generated password
        const password = crypto.randomUUID();
        const response = await auth.callRoute("POST", "/sign-up", {
          body: { email: newUserEmail, password },
        });
        if (response.type === "error") {
          return {
            success: false,
            error: response.error.message || "Failed to create user",
          };
        }
        if (response.type !== "json") {
          return {
            success: false,
            error: "Failed to create user",
          };
        }
        targetUserId = response.data.userId;
      } else if (userId !== undefined && userId !== "") {
        // Use selected user
        targetUserId = userId;
      } else {
        return {
          success: false,
          error: "No user selected or user creation not requested",
        };
      }

      // Check for conflicts - validate user doesn't have a different Stripe customer ID
      const existingUser = await userRepo.getUserById(targetUserId);
      if (
        existingUser?.stripeCustomerId !== undefined &&
        existingUser.stripeCustomerId !== null &&
        existingUser.stripeCustomerId !== "" &&
        existingUser.stripeCustomerId !== stripeCustomerId
      ) {
        return {
          success: false,
          error: `User is already linked to Stripe customer ${existingUser.stripeCustomerId}`,
        };
      }

      // Link the customer; only the durable hook starts a sync for a new link.
      const stripe = getStripeFragment(context.get(requestContext).cloudflare.env);
      const linkError = await linkStripeCustomer(stripe, userRepo, {
        customerId: stripeCustomerId,
        referenceId: targetUserId,
      });
      if (linkError !== null && linkError !== "") {
        return { success: false, error: linkError };
      }

      // Existing links may be stale or have a failed hook; an active hook is left to finish.
      await stripe.requestCustomerSync({
        customerId: stripeCustomerId,
        referenceId: targetUserId,
      });
      return { success: true, userId: targetUserId };
    } catch (error) {
      console.error("Error syncing subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  if (intent === "check-user") {
    const stripeCustomerId = readFormText(formData, "stripeCustomerId") ?? "";
    const stripeCustomerEmail = readFormText(formData, "stripeCustomerEmail") ?? "";

    const userRepo = new UserRepo(context.get(requestContext).db);

    // Check by Stripe customer ID
    const userByStripeId = await userRepo.getUserByStripeCustomerId(stripeCustomerId);
    if (userByStripeId) {
      return {
        success: true,
        user: userByStripeId,
        matchType: "stripeCustomerId",
      };
    }

    // Check by email
    const userByEmail = await userRepo.getUserByEmail(stripeCustomerEmail);
    if (userByEmail) {
      return {
        success: true,
        user: userByEmail,
        matchType: "email",
      };
    }

    return {
      success: true,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: The check-user action JSON includes user: null when no existing user matches.
      user: null,
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: The check-user action JSON includes matchType: null when no existing user matches.
      matchType: null,
    };
  }

  return { success: false, error: "Invalid intent" };
}

export default function DashboardStripe({
  matches: _matches,
  loaderData,
  actionData: _actionData,
  params: _params,
  className,
  ...props
}: React.ComponentProps<"div"> & ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Stripe</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className={cn("flex flex-1 flex-col gap-6 p-4", className)} {...props}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Stripe Customers</h2>
          <Button render={<Link to="/dashboard/admin/stripe/bulk-import" />} nativeButton={false}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
        <StripeCustomersTable users={loaderData.users} />
      </div>
    </>
  );
}
