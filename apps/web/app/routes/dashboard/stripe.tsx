import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import { Upload } from "lucide-react";
import type { JSX } from "react";
import { Link } from "react-router";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { StripeCustomersTable } from "~/components/stripe-customers-table";
import { UserRepo } from "~/db/repo/user";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { linkStripeCustomer } from "~/fragno/stripe-durable-object";
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

export async function loader({ context }: Route.LoaderArgs): Promise<StripeCustomersLoaderData> {
  const userRepo = new UserRepo(context.get(requestContext).db);
  const users = await userRepo.getAllUsers();
  return { users };
}

export async function action({
  request,
  context,
}: Route.ActionArgs): Promise<StripeCustomerActionResult> {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "sync-subscription") {
    const stripeCustomerId = formData.get("stripeCustomerId") as string;
    const userId = formData.get("userId") as string | null;
    const createNewUser = formData.get("createNewUser") === "true";
    const newUserEmail = formData.get("newUserEmail") as string | null;

    const userRepo = new UserRepo(context.get(requestContext).db);
    const auth = createSimpleAuthServer(context.get(requestContext).pool);

    try {
      let targetUserId: string;

      if (createNewUser && newUserEmail) {
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
      } else if (userId) {
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
      if (existingUser?.stripeCustomerId && existingUser.stripeCustomerId !== stripeCustomerId) {
        return {
          success: false,
          error: `User is already linked to Stripe customer ${existingUser.stripeCustomerId}`,
        };
      }

      // Link user to Stripe customer and sync their subscription from Stripe
      const linkError = await linkStripeCustomer(
        context.get(requestContext).cloudflare.env,
        userRepo,
        {
          customerId: stripeCustomerId,
          referenceId: targetUserId,
        },
      );
      if (linkError) {
        return { success: false, error: linkError };
      }

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
    const stripeCustomerId = formData.get("stripeCustomerId") as string;
    const stripeCustomerEmail = formData.get("stripeCustomerEmail") as string;

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
      user: null,
      matchType: null,
    };
  }

  return { success: false, error: "Invalid intent" };
}

export default function DashboardStripe({
  matches,
  loaderData,
  actionData,
  params,
  className,
  ...props
}: React.ComponentProps<"div"> & Route.ComponentProps): JSX.Element {
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
          <Button asChild>
            <Link to="/dashboard/admin/stripe/bulk-import">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Link>
          </Button>
        </div>
        <StripeCustomersTable users={loaderData.users} />
      </div>
    </>
  );
}
