import type { AuthMeResponse } from "@fragno-dev/auth";
import { createFormsFragment } from "@fragno-dev/forms";

import { createPostgresPool, type PostgresPool } from "../db/postgres/is3a-postgres.ts";
import { createAdapter } from "./database-adapter.ts";
import { createSimpleAuthServer } from "./simple-auth-server.ts";

type FormsFragment = ReturnType<typeof createFormsFragment>;

export function createFormsServer(pool: PostgresPool | (() => PostgresPool)): FormsFragment {
  const resolvedPool = typeof pool === "function" ? pool() : pool;
  const auth = createSimpleAuthServer(resolvedPool);

  const getSession = async (headers: Headers): Promise<AuthMeResponse["user"] | null> => {
    const response = await auth.callRoute("GET", "/me", { headers });
    if (response.type === "json" && response.data) {
      return response.data.user;
    }
    return null;
  };

  return createFormsFragment(
    {
      staticForms: [],
    },
    { databaseAdapter: createAdapter(resolvedPool) },
  ).withMiddleware(async ({ path, headers }, { error }) => {
    // Admin routes require admin role
    if (path.startsWith("/admin")) {
      const user = await getSession(headers);
      if (!user || user.role !== "admin") {
        return error({ message: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
    }
    // Public routes (form viewing/submission) - no auth required
    return undefined;
  });
}

export const fragment: FormsFragment = createFormsServer(() => createPostgresPool());
