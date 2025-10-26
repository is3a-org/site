import { Settings2, Building2, Home, Sparkles, ArrowUp } from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import { OrganizationSwitcher } from "~/components/organization-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Link } from "react-router";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Organization",
    url: "/dashboard/organization",
    icon: Building2,
    isActive: true,
    items: [
      {
        title: "Overview",
        url: "/dashboard/organization",
      },
      {
        title: "Members",
        url: "/dashboard/organization/members",
      },
    ],
  },
  {
    title: "Developer",
    url: "#",
    icon: Settings2,
    isActive: true,
    items: [
      {
        title: "API Keys",
        url: "/dashboard/api-keys",
      },
    ],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar?: string;
    isAdmin: boolean;
    impersonatedBy: string | null;
  };
  organizations: {
    id: string;
    name: string;
    plan: string;
  }[];
  activeOrganizationId: string;
}

export function DashboardNavigationSidebar({
  user,
  organizations,
  activeOrganizationId,
  ...props
}: AppSidebarProps) {
  // Find the active organization
  const activeOrg = organizations.find((org) => org.id === activeOrganizationId);
  const isFreePlan = activeOrg?.plan === "free";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="gap-4">
        {isFreePlan && (
          <div className="px-2">
            <Card className="relative overflow-hidden border-violet-200/50 bg-linear-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 shadow-lg">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-fuchsia-500/10" />
              <CardContent className="relative px-4 py-2">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-violet-500/20 p-1.5">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-violet-900">Upgrade to Pro</h3>
                      <p className="text-xs text-violet-700">Unlock premium features</p>
                    </div>
                  </div>
                  <ArrowUp className="h-4 w-4 animate-bounce text-violet-600" />
                </div>

                <div className="mb-2 space-y-1.5">
                  <div className="flex items-center text-xs text-violet-800">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Unlimited inbox messages
                  </div>
                  <div className="flex items-center text-xs text-violet-800">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
                    More email addresses
                  </div>
                  <div className="flex items-center text-xs text-violet-800">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Higher attachment storage & retention
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="w-full border-0 bg-linear-to-r from-violet-600 to-purple-600 font-semibold text-white shadow-md hover:from-violet-700 hover:to-purple-700"
                >
                  <Link to="/dashboard/organization/plans">View Plans</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
