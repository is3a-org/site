import { useState } from "react";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/dashboard-home";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Button } from "~/components/ui/button";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { createStripeFragmentClient } from "@fragno-dev/stripe/react";

const PAGE_LIMIT = 100;
const { useCustomer } = createStripeFragmentClient();

export default function DashboardMembers({
  matches,
  className,
  ...props
}: React.ComponentProps<"div"> & Route.ComponentProps) {
  // FIXME: Fragno reactivity breaks when currentCursor is useState<string | undefined>
  //        Use it as a string for now
  const [currentCursor, setCurrentCursor] = useState<string>("");
  const [pageHistory, setPageHistory] = useState<string[]>([]);

  const { data, loading, error } = useCustomer({
    query: {
      limit: PAGE_LIMIT.toString(),
      startingAfter: currentCursor,
    },
  });

  const handleNextPage = () => {
    if (data?.customers && data.customers.length > 0) {
      const lastCustomerId = data.customers[data.customers.length - 1]?.id;
      if (lastCustomerId) {
        setCurrentCursor(lastCustomerId);
        setPageHistory([...pageHistory, lastCustomerId]);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentCursor) {
      setCurrentCursor(pageHistory.slice(-1)[0] ?? "");
      setPageHistory(pageHistory.slice(0, -1));
    }
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Members</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className={cn("flex flex-1 flex-col gap-6 p-4", className)} {...props}>
        <h2 className="text-2xl font-bold">Members</h2>

        {loading && <div>Loading members...</div>}

        {error && <div className="text-red-600">Error loading members: {error.message}</div>}

        {data?.customers && (
          <>
            <Table>
              <TableCaption>
                Showing {data.customers.length} member{data.customers.length !== 1 ? "s" : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Stripe customerID</TableHead>
                  <TableHead>Membership Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name ?? "—"}</TableCell>
                    <TableCell>{customer.email ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{customer.id}</TableCell>
                    <TableCell>?</TableCell>
                    <TableCell>{new Date(customer.created * 1000).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousPage}
                disabled={loading || pageHistory.length === 0}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">Page {pageHistory.length + 1}</span>
              <Button
                onClick={handleNextPage}
                disabled={loading || !data.hasMore}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
