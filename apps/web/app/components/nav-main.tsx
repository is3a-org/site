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
import { NavLink } from "react-router";

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
        defaultOpen={item.isActive}
        className="group/collapsible"
        render={<SidebarMenuItem />}
      >
        <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  render={
                    <NavLink
                      to={subItem.url}
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    />
                  }
                >
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    ) : (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          tooltip={item.title}
          render={
            // NavLink sets aria-current on the current page, which draws the sidebar bracket.
            <NavLink
              to={item.url}
              end={item.url === "/dashboard"}
              onClick={() => {
                setOpenMobile(false);
              }}
            />
          }
          nativeButton={false}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
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
