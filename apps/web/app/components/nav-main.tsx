import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@is3a/design-system/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@is3a/design-system/sidebar";
import { ChevronRight } from "lucide-react";
import type { ComponentProps, JSXElementConstructor, JSX } from "react";
import { Link } from "react-router";

interface NavigationItem {
  readonly title: string;
  readonly url: string;
  readonly icon?: JSXElementConstructor<ComponentProps<"svg">>;
  readonly isActive?: boolean;
  readonly adminOnly?: boolean;
  readonly items?: readonly Readonly<{ title: string; url: string }>[];
}

export function NavMain({ items }: Readonly<{ items: readonly NavigationItem[] }>): JSX.Element {
  const { setOpenMobile } = useSidebar();

  // Split items into regular and admin sections
  const regularItems = items.filter((item) => item.adminOnly !== true);
  const adminItems = items.filter((item) => item.adminOnly === true);

  const renderMenuItem = (item: NavigationItem): JSX.Element =>
    item.items !== undefined && item.items.length > 0 ? (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={item.isActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild>
                    <Link
                      to={subItem.url}
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    >
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    ) : (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild tooltip={item.title}>
          <Link
            to={item.url}
            onClick={() => {
              setOpenMobile(false);
            }}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );

  return (
    <>
      {/* Regular navigation items */}
      {regularItems.length > 0 && (
        <SidebarGroup>
          <SidebarMenu>{regularItems.map((item) => renderMenuItem(item))}</SidebarMenu>
        </SidebarGroup>
      )}

      {/* Admin navigation items */}
      {adminItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>{adminItems.map((item) => renderMenuItem(item))}</SidebarMenu>
        </SidebarGroup>
      )}
    </>
  );
}
