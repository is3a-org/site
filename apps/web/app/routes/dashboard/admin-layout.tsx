import type { Route } from "./+types/admin-layout";
import { Outlet, redirect } from "react-router";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";

export async function loader({ context, request }: Route.LoaderArgs) {
  const auth = createSimpleAuthServer(context.pool);

  const response = await auth.callRoute("GET", "/me", {
    query: { sessionId: request.url.split("?")[1] },
    headers: request.headers,
  });

  if (response.type === "json") {
    const { role } = response.data;

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

export default function AdminLayout() {
  return <Outlet />;
}
