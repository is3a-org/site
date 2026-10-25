import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@is3a/design-system/breadcrumb";
import type { JSX } from "react";
import type Stripe from "stripe";

import { BulkImportWizard } from "~/components/bulk-import-wizard";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { UserRepo } from "~/db/repo/user";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { parseStripeCustomerIds, readFormText } from "~/fragno/request-form";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { linkStripeCustomer } from "~/fragno/stripe-durable-object";
import { createStripeClient } from "~/lib/stripe.server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/bulk-import";

interface StripeBulkImportLoaderData {
  users: Awaited<ReturnType<UserRepo["getAllUsers"]>>;
  stripeCustomers: Pick<Stripe.Customer, "id" | "email" | "name" | "created">[];
}

interface StripeCustomerImportResult {
  customerId: string;
  status: "success" | "error";
  userId?: string;
  error?: string;
}

type StripeBulkImportActionResult =
  | {
      success: false;
      error: string;
      results?: StripeCustomerImportResult[];
      customerId?: string;
    }
  | { success: true; results: StripeCustomerImportResult[]; message: string };

export async function loader({
  context,
}: Readonly<Route.LoaderArgs>): Promise<StripeBulkImportLoaderData> {
  const userRepo = new UserRepo(context.get(requestContext).db);

  // Fetch existing users for matching
  const users = await userRepo.getAllUsers();

  // Fetch Stripe customers
  const stripeClient = createStripeClient();
  const customers = await stripeClient.customers.list({ limit: 100 });

  return {
    users,
    stripeCustomers: customers.data.map(({ id, email, name, created }) => ({
      id,
      email,
      name,
      created,
    })),
  };
}

export async function action({
  request,
  context,
}: Readonly<Route.ActionArgs>): Promise<StripeBulkImportActionResult> {
  const formData = await request.formData();
  const intent = readFormText(formData, "intent") ?? "";

  if (intent === "bulk-sync-subscription") {
    const customerIdsJson = readFormText(formData, "customerIds") ?? "";
    const customerIds = parseStripeCustomerIds(customerIdsJson);

    const userRepo = new UserRepo(context.get(requestContext).db);
    const auth = createSimpleAuthServer(context.get(requestContext).pool);
    const stripeClient = createStripeClient();

    const results: StripeCustomerImportResult[] = [];

    // Process each customer sequentially, stopping on first error
    for (const customerId of customerIds) {
      try {
        // Fetch customer details from Stripe
        const customer = await stripeClient.customers.retrieve(customerId);

        if (customer.deleted) {
          return {
            success: false,
            error: `Stripe customer ${customerId} has been deleted`,
            results,
          };
        }

        const customerEmail = customer.email;
        console.log(
          `[Bulk Import] Starting match for Stripe customer ${customerId} with email: ${customerEmail === null || customerEmail === "" ? "none" : customerEmail}`,
        );

        // Check if user already exists
        let targetUserId: string | undefined;

        // First check by Stripe customer ID
        console.log(`[Bulk Import] Attempting to match by Stripe customer ID: ${customerId}`);
        const userByStripeId = await userRepo.getUserByStripeCustomerId(customerId);
        if (userByStripeId) {
          targetUserId = userByStripeId.id;
          console.log(`[Bulk Import] Found existing user by Stripe ID: ${targetUserId}`);
        }

        // If not found and customer has email, check by email
        if (
          (targetUserId === undefined || targetUserId === "") &&
          customerEmail !== null &&
          customerEmail !== ""
        ) {
          console.log(
            `[Bulk Import] No match by Stripe ID, attempting to match by email: ${customerEmail}`,
          );
          const userByEmail = await userRepo.getUserByEmail(customerEmail);
          if (userByEmail) {
            targetUserId = userByEmail.id;
            console.log(`[Bulk Import] Found existing user by email: ${targetUserId}`);
          }
        }

        // If still no user found, create one
        if (targetUserId === undefined || targetUserId === "") {
          console.log(`[Bulk Import] No existing user found, attempting to create new user`);
          if (customerEmail === null || customerEmail === "") {
            return {
              success: false,
              error: `Stripe customer ${customerId} has no email address and cannot be auto-created`,
              results,
            };
          }

          // Create new user with auto-generated password
          const password = crypto.randomUUID();
          const response = await auth.callRoute("POST", "/sign-up", {
            body: { email: customerEmail, password },
          });
          if (response.type === "error") {
            return {
              success: false,
              error: response.error.message || `Failed to create user for ${customerEmail}`,
              results,
            };
          }
          if (response.type !== "json") {
            return {
              success: false,
              error: `Failed to create user for ${customerEmail}`,
              results,
            };
          }
          targetUserId = response.data.userId;
          console.log(`[Bulk Import] Created new user: ${targetUserId}`);
        }

        if (targetUserId === "") {
          return {
            success: false,
            error: `Failed to resolve user for Stripe customer ${customerId}`,
            results,
          };
        }

        console.log(`[Bulk Import] Final matched user ID: ${targetUserId}`);

        // Check for conflicts - validate user doesn't have a different Stripe customer ID
        const existingUser = await userRepo.getUserById(targetUserId);
        if (
          existingUser?.stripeCustomerId !== undefined &&
          existingUser.stripeCustomerId !== null &&
          existingUser.stripeCustomerId !== "" &&
          existingUser.stripeCustomerId !== customerId
        ) {
          return {
            success: false,
            error: `User ${targetUserId} is already linked to Stripe customer ${existingUser.stripeCustomerId}`,
            results,
          };
        }

        // Link user to Stripe customer and sync their subscription from Stripe
        const linkError = await linkStripeCustomer(
          context.get(requestContext).cloudflare.env,
          userRepo,
          {
            customerId,
            referenceId: targetUserId,
          },
        );
        if (linkError !== null && linkError !== "") {
          return { success: false, error: linkError, results };
        }

        results.push({
          customerId,
          status: "success",
          userId: targetUserId,
        });
      } catch (error) {
        // Stop on first error as per user preference
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          customerId,
          results,
        };
      }
    }

    // All succeeded
    return {
      success: true,
      results,
      message: `Successfully imported ${results.length} customer(s)`,
    };
  }

  return { success: false, error: "Invalid intent" };
}

export default function BulkImportPage({
  loaderData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/stripe">Stripe</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Bulk Import</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h2 className="text-2xl font-bold">Bulk Import Stripe Customers</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Import multiple Stripe customers and their subscriptions in one batch
          </p>
        </div>

        <BulkImportWizard
          stripeCustomers={loaderData.stripeCustomers}
          existingUsers={loaderData.users}
        />
      </div>
    </>
  );
}
