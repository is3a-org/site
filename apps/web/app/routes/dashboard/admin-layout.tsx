import type { JSX } from "react";
import { Outlet, redirect } from "react-router";

import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/admin-layout";

export async function loader({ context, request }: Route.LoaderArgs) {
  const auth = createSimpleAuthServer(context.get(requestContext).pool);

  const response = await auth.callRoute("GET", "/me", {
    headers: request.headers,
  });

  if (response.type === "json") {
    const { role } = response.data.user;

    // Check if user is admin
    if (role !== "admin") {
      // Redirect non-admin users to dashboard
      return redirect("/dashboard");
    }

    // User is admin, allow access
    return {};
  }

  // Not authenticated, redirect to login
  return redirect("/login");
}

export default function AdminLayout(): JSX.Element {
  return <Outlet />;
}
