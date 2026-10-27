import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import type { JSX } from "react";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { UserRepo } from "~/db/repo/user";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { getMembershipByPriceId } from "~/lib/memberships";
import { cn } from "~/lib/utils";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/members";

interface MembersLoaderData {
  members: Awaited<ReturnType<UserRepo["getAllUsers"]>>;
}

export async function loader({ context }: Readonly<Route.LoaderArgs>): Promise<MembersLoaderData> {
  const userRepo = new UserRepo(context.get(requestContext).db);
  return { members: await userRepo.getAllUsers() };
}

const toMembershipType = (priceId?: string | null): string => {
  const name = getMembershipByPriceId(priceId)?.name;
  return name === undefined || name === "" ? "-" : name;
};

export default function DashboardMembers({
  matches: _matches,
  loaderData,
  actionData: _actionData,
  params: _params,
  className,
  ...props
}: React.ComponentProps<"div"> & ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
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
            Showing {members.length} member{members.length === 1 ? "" : "s"}
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
              <TableRow key={member.id}>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  {member.subscriptionId ?? "—"}
                  {member.subscriptions.length > 1 && (
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        Subscription history ({member.subscriptions.length})
                      </summary>
                      <ul className="mt-2 space-y-2">
                        {member.subscriptions.map((subscription) => (
                          <li key={subscription.id}>
                            <p className="font-mono text-xs">{subscription.id}</p>
                            <p className="text-muted-foreground">
                              {subscription.status} · {toMembershipType(subscription.priceId)} ·
                              period ends {new Date(subscription.periodEnd).toLocaleDateString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </TableCell>
                <TableCell>
                  {member.stripeCustomerId === null || member.stripeCustomerId === ""
                    ? "-"
                    : member.stripeCustomerId}
                </TableCell>
                <TableCell>
                  {member.subscriptionStatus === null || member.subscriptionStatus === ""
                    ? "-"
                    : member.subscriptionStatus}
                </TableCell>
                <TableCell>{toMembershipType(member.subscriptionStripePriceId)}</TableCell>
                <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
