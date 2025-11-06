import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { createStripeFragmentClient } from "@fragno-dev/stripe/react";
import { SyncSubscriptionDialog } from "~/components/sync-subscription-dialog";
import { MoreHorizontal, RefreshCw } from "lucide-react";

const PAGE_LIMIT = 40;
const { useCustomers } = createStripeFragmentClient();

type User = {
  id: string;
  email: string;
  stripeCustomerId: string | null;
};

type StripeCustomer = {
  id: string;
  email: string | null;
  name?: string | null;
  created: number;
};

type StripeCustomersTableProps = {
  users: User[];
};

export function StripeCustomersTable({ users }: StripeCustomersTableProps) {
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<StripeCustomer | null>(null);

  const { data, loading, error } = useCustomers({
    query: {
      limit: PAGE_LIMIT.toString(),
      startingAfter: currentCursor,
    },
  });

  const handleNextPage = () => {
    if (data?.customers && data.customers.length > 0) {
      const lastCustomerId = data.customers[data.customers.length - 1]?.id;
      if (lastCustomerId) {
        if (currentCursor) {
          setPageHistory([...pageHistory, currentCursor]);
        }
        setCurrentCursor(lastCustomerId);
      }
    }
  };

  const handlePreviousPage = () => {
    if (pageHistory.length > 0) {
      const previousCursor = pageHistory[pageHistory.length - 1];
      setCurrentCursor(previousCursor);
      setPageHistory(pageHistory.slice(0, -1));
    }
  };

  if (loading) {
    return <div>Loading customers...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error loading customers: {error.message}</div>;
  }

  if (!data?.customers) {
    return null;
  }

  const handleOpenSyncDialog = (customer: StripeCustomer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  return (
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
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenSyncDialog(customer)}>
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
        <Button
          onClick={handlePreviousPage}
          disabled={loading || pageHistory.length === 0}
          variant="outline"
        >
          Previous
        </Button>
        <span className="text-muted-foreground text-sm">Page {pageHistory.length + 1}</span>
        <Button onClick={handleNextPage} disabled={loading || !data.hasMore} variant="outline">
          Next
        </Button>
      </div>
    </>
  );
}
