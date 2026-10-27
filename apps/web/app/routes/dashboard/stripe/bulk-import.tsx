import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import type { JSX } from "react";
import { data } from "react-router";
import { z } from "zod";

import { BulkImportWizard } from "~/components/bulk-import-wizard";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { UserRepo } from "~/db/repo/user";
import { requireAdmin } from "~/fragno/admin-auth.server";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { parseStripeCustomerIds, readFormText } from "~/fragno/request-form";
import { getStripeFragment } from "~/fragno/stripe-durable-object";
import {
  bulkImportIdSchema,
  type BulkImportJob,
  type BulkImportResponse,
  type CustomerSyncState,
  type ImportCustomer,
} from "~/lib/bulk-import";
import { collectStripeImportCustomers } from "~/lib/stripe-import-customers";
import { createStripeClient } from "~/lib/stripe.server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/bulk-import";

interface StripeBulkImportLoaderData {
  users: Awaited<ReturnType<UserRepo["getAllUsers"]>>;
  stripeCustomers: ImportCustomer[];
  syncStates: CustomerSyncState[];
  job?: BulkImportJob;
}

export async function loader({
  context,
  request,
}: Readonly<Route.LoaderArgs>): Promise<StripeBulkImportLoaderData> {
  const runtime = context.get(requestContext);
  const ownerId = await requireAdmin(request, runtime.pool);
  const userRepo = new UserRepo(runtime.db);
  const stripe = getStripeFragment(runtime.cloudflare.env);
  const requestedId = new URL(request.url).searchParams.get("import");
  const id = requestedId === null ? undefined : bulkImportIdSchema.parse(requestedId);
  const [users, stripeCustomers, job] = await Promise.all([
    userRepo.getAllUsers(),
    collectStripeImportCustomers(createStripeClient().customers.list({ limit: 100 })),
    stripe.getImport(ownerId, id),
  ]);
  const links = users.flatMap((user) =>
    user.stripeCustomerId !== null && user.stripeCustomerId !== ""
      ? [{ customerId: user.stripeCustomerId, referenceId: user.id }]
      : [],
  );
  const syncStates = await stripe.getCustomerSyncStates(links);
  return { users, stripeCustomers, syncStates, job };
}

export async function action({
  request,
  context,
}: Readonly<Route.ActionArgs>): Promise<ReturnType<typeof data<BulkImportResponse>>> {
  const runtime = context.get(requestContext);
  const ownerId = await requireAdmin(request, runtime.pool);
  const formData = await request.formData();
  const intent = readFormText(formData, "intent");
  const stripe = getStripeFragment(runtime.cloudflare.env);
  try {
    if (intent === "start") {
      const ids = parseStripeCustomerIds(readFormText(formData, "customerIds") ?? "");
      const job = await stripe.startImport(ownerId, ids);
      return data<BulkImportResponse>({ success: true, job });
    }
    if (intent === "process" || intent === "retry" || intent === "status") {
      const id = bulkImportIdSchema.parse(readFormText(formData, "importId"));
      const job = await stripe.advanceImport(ownerId, id, intent);
      return data<BulkImportResponse>({ success: true, job });
    }
    return data<BulkImportResponse>(
      { success: false, error: "Invalid import action" },
      { status: 400 },
    );
  } catch (error) {
    const invalidInput = error instanceof z.ZodError || error instanceof SyntaxError;
    let message = "Import request failed. Saved progress can be resumed.";
    if (invalidInput) {
      message = "Select between 1 and 50 valid Stripe customer IDs, or provide a valid import ID.";
    } else if (error instanceof Error) {
      message = error.message;
    }
    return data<BulkImportResponse>(
      { success: false, error: message },
      { status: invalidInput ? 400 : 500 },
    );
  }
}

export function ErrorBoundary(): JSX.Element {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Import interrupted</h2>
      <p className="max-w-xl text-sm text-muted-foreground">
        The request could not finish. Completed customer checkpoints are saved. Reload to recover
        the latest import; accounts and billing will not be duplicated.
      </p>
      <Button
        render={<a href="/dashboard/admin/stripe/bulk-import">Recover saved import</a>}
        nativeButton={false}
      />
    </div>
  );
}

export default function BulkImportPage({
  loaderData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/admin/stripe">Stripe</BreadcrumbLink>
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
            Create or link accounts, then track subscription sync separately. Existing billing is
            never changed.
          </p>
        </div>
        <BulkImportWizard
          stripeCustomers={loaderData.stripeCustomers}
          existingUsers={loaderData.users}
          syncStates={loaderData.syncStates}
          initialJob={loaderData.job}
        />
      </div>
    </>
  );
}
