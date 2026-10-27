import type { PostgresPool } from "~/db/postgres/is3a-postgres";

import { createSimpleAuthServer } from "./simple-auth-server";

/** Parent loaders do not protect child actions; authorize each admin entry point itself. */
export async function requireAdmin(request: Request, pool: PostgresPool): Promise<string> {
  const auth = createSimpleAuthServer(pool);
  const response = await auth.callRoute("GET", "/me", { headers: request.headers });
  if (response.type !== "json") {
    throw new Response("Authentication required", { status: 401 });
  }
  if (response.data.user.role !== "admin") {
    throw new Response("Administrator access required", { status: 403 });
  }
  return response.data.user.id;
}
