import type { Route } from "./+types/dashboard-layout";
import { isRouteErrorResponse, Outlet, redirect } from "react-router";
import { DashboardNavigationSidebar } from "~/routes/dashboard/dashboard-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle } from "lucide-react";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Dashboard" }, { name: "description", content: "Dashboard" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const mockOrganizations = [
    {
      id: "org_1",
      name: "Acme Corp",
      slug: "acme",
      plan: "pro" as const,
    },
    {
      id: "org_2",
      name: "Beta Inc",
      slug: "beta",
      plan: "free" as const,
    },
  ];

  const activeOrganizationId = "org_1";

  const auth = createSimpleAuthServer(context.db);

  const response = await auth.callRoute("GET", "/me", {
    query: { sessionId: request.url.split("?")[1] },
    headers: request.headers,
  });

  if (response.ok) {
    // This means we're logged in
    const me = (await response.json()) as { userId: string; email: string };
    return {
      user: {
        name: me.email,
        email: me.email,
        avatar: undefined,
        isAdmin: false,
        impersonatedBy: null,
      },
      organizations: mockOrganizations,
      activeOrganization: mockOrganizations[0],
      activeOrganizationId,
    };
  }

  return redirect("/login");
}

export function ErrorBoundary({ error, loaderData }: Route.ErrorBoundaryProps) {
  if (!loaderData) {
    return <div>Error</div>;
  }

  const { user, organizations, activeOrganizationId } = loaderData;

  const errorContent = isRouteErrorResponse(error) ? (
    <Card className="mx-4 my-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="text-destructive h-5 w-5" />
          <CardTitle>Error {error.status}</CardTitle>
        </div>
        <CardDescription>{error.statusText}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{error.data}</p>
      </CardContent>
    </Card>
  ) : error instanceof Error ? (
    <Card className="mx-4 my-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="text-destructive h-5 w-5" />
          <CardTitle>Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        {error.stack && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Stack Trace:</p>
            <pre className="bg-muted overflow-auto rounded-md p-4 text-xs">{error.stack}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  ) : (
    <Card className="mx-4 my-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="text-destructive h-5 w-5" />
          <CardTitle>Unknown Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">An unexpected error occurred.</p>
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <DashboardNavigationSidebar
        user={user}
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Error</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {errorContent}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { user, organizations, activeOrganizationId } = loaderData;

  return (
    <SidebarProvider>
      <DashboardNavigationSidebar
        user={user}
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
      />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
