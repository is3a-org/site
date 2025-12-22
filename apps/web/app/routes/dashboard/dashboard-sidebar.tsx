import { Home, MapPin, Users, HandCoins, Sparkles, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { StripeIcon } from "~/components/icons/stripe";

import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
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
    title: "Membership",
    url: "/dashboard/subscribe",
    icon: Sparkles,
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
  {
    title: "Members",
    url: "/dashboard/admin/members",
    icon: HandCoins,
    adminOnly: true,
  },
  {
    title: "Stripe",
    url: "/dashboard/admin/stripe",
    icon: StripeIcon as LucideIcon,
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
}

function SidebarLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Link to="/">
      <IS3ALogo variant={isCollapsed ? "icon" : "full"} className="h-8" />
    </Link>
  );
}

export function DashboardNavigationSidebar({ user, ...props }: AppSidebarProps) {
  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => !item.adminOnly || user.isAdmin);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="ml-2 w-full overflow-hidden">
          <SidebarLogo />
        </div>
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
