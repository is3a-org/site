import { Home, MapPin, Users } from "lucide-react";

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

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    adminOnly: false,
  },
  {
    title: "Locations",
    url: "/dashboard/admin/locations",
    icon: MapPin,
    adminOnly: true,
  },
  {
    title: "Users",
    url: "/dashboard/admin/users",
    icon: Users,
    adminOnly: true,
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
  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => !item.adminOnly || user.isAdmin);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter className="gap-4">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
