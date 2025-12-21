import { cn } from "~/lib/utils";
import type { Route } from "./+types/members";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { UserRepo } from "~/db/repo/user";
import { getMembershipByPriceId } from "~/lib/memberships";
import { formatDateTime } from "~/lib/date-utils";

export async function loader({ context }: Route.LoaderArgs) {
  const userRepo = new UserRepo(context.db);
  return { members: await userRepo.getAllUsers() };
}

const toMembershipType = (priceId?: string | null): string => {
  return getMembershipByPriceId(priceId)?.name || "-";
};

export default function DashboardMembers({
  matches,
  loaderData,
  actionData,
  params,
  className,
  ...props
}: React.ComponentProps<"div"> & Route.ComponentProps) {
  const { members } = loaderData;

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Members</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className={cn("flex flex-1 flex-col gap-6 p-4", className)} {...props}>
        <h2 className="text-2xl font-bold">Members</h2>
        <Table>
          <TableCaption>
            Showing {members.length} member{members.length !== 1 ? "s" : ""}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Subscription ID</TableHead>
              <TableHead>Stripe Customer ID</TableHead>
              <TableHead>Subscription Status</TableHead>
              <TableHead>Membership Type</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id + member.subscriptionId}>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.subscriptionId}</TableCell>
                <TableCell>{member.stripeCustomerId || "-"}</TableCell>
                <TableCell>{member.subscriptionStatus || "-"}</TableCell>
                <TableCell>{toMembershipType(member.subscriptionStripePriceId)}</TableCell>
                <TableCell>{formatDateTime(member.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
