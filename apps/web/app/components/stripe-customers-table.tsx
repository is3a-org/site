import { createStripeFragmentClient } from "@fragno-dev/stripe/react";
import { Button } from "@is3a/design-system/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@is3a/design-system/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";

import { SyncSubscriptionDialog } from "~/components/sync-subscription-dialog";

import {
  advanceStripeCustomerPage,
  rewindStripeCustomerPage,
  type StripeCustomerPagination,
} from "./stripe-customer-pagination";

const PAGE_LIMIT = 40;
const { useCustomers } = createStripeFragmentClient();

interface User {
  readonly id: string;
  readonly email: string;
  readonly stripeCustomerId: string | null;
}

interface StripeCustomer {
  readonly id: string;
  readonly email: string | null;
  readonly name?: string | null;
  readonly created: number;
}

interface StripeCustomersTableProps {
  readonly users: readonly User[];
}

export function StripeCustomersTable({
  users,
}: StripeCustomersTableProps): JSX.Element | undefined {
  const [pagination, setPagination] = useState<StripeCustomerPagination>({ pageHistory: [] });
  const { currentCursor, pageHistory } = pagination;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<StripeCustomer>();

  const { data, loading, error } = useCustomers({
    query: {
      limit: PAGE_LIMIT.toString(),
      startingAfter: currentCursor,
    },
  });

  const handleNextPage = (): void => {
    if (data?.customers && data.customers.length > 0) {
      const lastCustomerId = data.customers.at(-1)?.id;
      if (lastCustomerId !== undefined && lastCustomerId !== "") {
        setPagination((previous) => advanceStripeCustomerPage(previous, lastCustomerId));
      }
    }
  };

  const handlePreviousPage = (): void => {
    if (pageHistory.length > 0) {
      setPagination((previous) => rewindStripeCustomerPage(previous));
    }
  };

  if (loading) {
    return <div>Loading customers...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error loading customers: {error.message}</div>;
  }

  if (!data?.customers) {
    return undefined;
  }

  const handleOpenSyncDialog = (customer: StripeCustomer): void => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  return (
    <>
      <Table>
        <TableCaption>
          Showing {data.customers.length} member{data.customers.length === 1 ? "" : "s"}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Stripe customerID</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name ?? "—"}</TableCell>
              <TableCell>{customer.email ?? "—"}</TableCell>
              <TableCell className="font-mono text-sm">{customer.id}</TableCell>
              <TableCell>{new Date(customer.created * 1000).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        handleOpenSyncDialog(customer);
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedCustomer && (
        <SyncSubscriptionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={selectedCustomer}
          allUsers={users}
        />
      )}

      <div className="flex items-center justify-between">
        <Button onClick={handlePreviousPage} disabled={pageHistory.length === 0} variant="outline">
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {pageHistory.length + 1}</span>
        <Button onClick={handleNextPage} disabled={!data.hasMore} variant="outline">
          Next
        </Button>
      </div>
    </>
  );
}
