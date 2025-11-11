import { cn } from "~/lib/utils";
import type { Route } from "./+types/dashboard-home";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";

export async function loader({ context: _context, request: _request }: Route.LoaderArgs) {
  return {};
}

export default function DashboardHome({
  matches,
  className,
  ...props
}: React.ComponentProps<"div"> & Route.ComponentProps) {
  // Get user data from parent route loader
  const parentData = matches[1].loaderData;

  const user = parentData?.user || {
    name: "John Doe",
    email: "john@example.com",
    avatar: undefined,
    role: "Member",
  };
  const organizations = parentData?.organizations || [];
  const activeOrganizationId = parentData?.activeOrganizationId || "org_1";

  const activeOrg = organizations.find((org) => org.id === activeOrganizationId);

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Home</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className={cn("flex flex-1 flex-col gap-6 p-4", className)} {...props}>
        {/* Welcome Section */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
            </div>
            <p className="text-muted-foreground">
              {activeOrg?.name || "Your Organization"} • {user.email}
            </p>
            {user.isAdmin && <Badge>Admin</Badge>}
          </div>
        </div>
      </div>
    </>
  );
}
