import type { Route } from "./+types/bulk-import";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { BulkImportWizard } from "~/components/bulk-import-wizard";
import { UserRepo } from "~/db/repo/user";
import { createStripeServer } from "~/fragno/stripe-server";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";

export async function loader({ context }: Route.LoaderArgs) {
  const userRepo = new UserRepo(context.db);
  const stripe = createStripeServer(context.pool);

  // Fetch existing users for matching
  const users = await userRepo.getAllUsers();

  // Fetch Stripe customers
  const stripeClient = stripe.services.getStripeClient();
  const customers = await stripeClient.customers.list({ limit: 100 });

  return {
    users,
    stripeCustomers: customers.data,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "bulk-sync-subscription") {
    const customerIdsJson = formData.get("customerIds") as string;
    const customerIds = JSON.parse(customerIdsJson) as string[];

    const userRepo = new UserRepo(context.db);
    const auth = createSimpleAuthServer(context.pool);
    const stripe = createStripeServer(context.pool);
    const stripeClient = stripe.services.getStripeClient();

    const results: Array<{
      customerId: string;
      status: "success" | "error";
      userId?: string;
      error?: string;
    }> = [];

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
          `[Bulk Import] Starting match for Stripe customer ${customerId} with email: ${customerEmail || "none"}`,
        );

        // Check if user already exists
        let targetUserId: string | null = null;

        // First check by Stripe customer ID
        console.log(`[Bulk Import] Attempting to match by Stripe customer ID: ${customerId}`);
        const userByStripeId = await userRepo.getUserByStripeCustomerId(customerId);
        if (userByStripeId) {
          targetUserId = userByStripeId.id;
          console.log(`[Bulk Import] Found existing user by Stripe ID: ${targetUserId}`);
        }

        // If not found and customer has email, check by email
        if (!targetUserId && customerEmail) {
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
        if (!targetUserId) {
          console.log(`[Bulk Import] No existing user found, attempting to create new user`);
          if (!customerEmail) {
            return {
              success: false,
              error: `Stripe customer ${customerId} has no email address and cannot be auto-created`,
              results,
            };
          }

          // Create new user with auto-generated password
          const password = crypto.randomUUID();
          const newUser = await auth.services.createUser(customerEmail, password);
          targetUserId = newUser.id;
          console.log(`[Bulk Import] Created new user: ${targetUserId}`);
        }

        console.log(`[Bulk Import] Final matched user ID: ${targetUserId}`);

        // Check for conflicts - validate user doesn't have a different Stripe customer ID
        const existingUser = await userRepo.getUserById(targetUserId);
        if (existingUser?.stripeCustomerId && existingUser.stripeCustomerId !== customerId) {
          return {
            success: false,
            error: `User ${targetUserId} is already linked to Stripe customer ${existingUser.stripeCustomerId}`,
            results,
          };
        }

        // Link user to Stripe customer
        await userRepo.setStripeCustomerId(targetUserId, customerId);

        // Sync subscription from Stripe
        await stripe.services.syncStripeSubscriptions(targetUserId, customerId);

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

export default function BulkImportPage({ loaderData }: Route.ComponentProps) {
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
          <p className="text-muted-foreground mt-2 text-sm">
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
