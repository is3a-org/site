import { Users, ClipboardList, Home } from "lucide-react";
import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "./sidebar";

const meta = { title: "Navigation/Sidebar", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;

export function Dashboard(): ReactElement {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 font-semibold">IS3A</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Association</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Overview">
                  <Home />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members">
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Forms">
                  <ClipboardList />
                  <span>Forms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <h1 className="font-semibold">Overview</h1>
        </header>
        <main className="p-6">
          <p className="text-sm text-muted-foreground">
            Use the toggle to collapse the sidebar. On a narrow viewport it opens as a sheet.
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
