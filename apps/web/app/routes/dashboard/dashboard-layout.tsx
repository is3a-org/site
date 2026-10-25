import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@is3a/design-system/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Separator } from "@is3a/design-system/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@is3a/design-system/sidebar";
import { AlertCircle } from "lucide-react";
import type { JSX } from "react";
import { isRouteErrorResponse, Outlet, redirect } from "react-router";

import type { AuthMeResponse } from "@fragno-dev/auth";

import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { requestContext } from "~/request-context";
import { DashboardNavigationSidebar } from "~/routes/dashboard/dashboard-sidebar";

import type { Route } from "./+types/dashboard-layout";

export function meta(_: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: "Dashboard" }, { name: "description", content: "Dashboard" }];
}

interface DashboardLoaderData {
  user: Pick<AuthMeResponse["user"], "email" | "role"> & {
    name: string;
    avatar: undefined;
    isAdmin: boolean;
    impersonatedBy: null;
  };
}

export async function loader({
  context,
  request,
}: Route.LoaderArgs): Promise<Response | DashboardLoaderData> {
  const auth = createSimpleAuthServer(context.get(requestContext).pool);

  const response = await auth.callRoute("GET", "/me", {
    headers: request.headers,
  });

  if (response.type === "json") {
    const { email, role } = response.data.user;

    return {
      user: {
        name: email,
        email,
        avatar: undefined,
        isAdmin: role == "admin",
        impersonatedBy: null,
        role: role,
      },
    };
  }

  return redirect("/login");
}

export function ErrorBoundary({ error, loaderData }: Route.ErrorBoundaryProps): JSX.Element {
  if (!loaderData) {
    return <div>Error</div>;
  }

  const { user } = loaderData;

  const errorContent = isRouteErrorResponse(error) ? (
    <Card className="mx-4 my-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Error {error.status}</CardTitle>
        </div>
        <CardDescription>{error.statusText}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{error.data}</p>
      </CardContent>
    </Card>
  ) : error instanceof Error ? (
    <Card className="mx-4 my-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        {error.stack && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Stack Trace:</p>
            <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">{error.stack}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  ) : (
    <Card className="mx-4 my-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Unknown Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">An unexpected error occurred.</p>
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <DashboardNavigationSidebar user={user} />
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

export default function Page({ loaderData }: Route.ComponentProps): JSX.Element {
  const { user } = loaderData;

  return (
    <SidebarProvider>
      <DashboardNavigationSidebar user={user} />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
