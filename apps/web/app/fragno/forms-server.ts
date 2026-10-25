import type { AuthMeResponse } from "@fragno-dev/auth";
import { createFormsFragment } from "@fragno-dev/forms";

import {
  createPostgresPool,
  resolvePostgresPool,
  type PostgresPool,
} from "../db/postgres/is3a-postgres.ts";
import { createAdapter } from "./database-adapter.ts";
import { membershipRequestForm } from "./membership-request-form.ts";
import { createSimpleAuthServer } from "./simple-auth-server.ts";

type FormsFragment = ReturnType<typeof createFormsFragment>;

export function createFormsServer(pool: PostgresPool | (() => PostgresPool)): FormsFragment {
  const resolvedPool = resolvePostgresPool(pool);
  const auth = createSimpleAuthServer(resolvedPool);

  const getSession = async (headers: Headers): Promise<AuthMeResponse["user"] | null> => {
    const response = await auth.callRoute("GET", "/me", { headers });
    if (response.type === "json") {
      return response.data.user;
    }
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Session lookup returns a nullable user, matching the authentication API contract.
    return null;
  };

  return createFormsFragment(
    {
      staticForms: [membershipRequestForm],
    },
    { databaseAdapter: createAdapter(resolvedPool) },
  ).withMiddleware(async ({ path, headers }, { error }): Promise<Response | undefined> => {
    // Admin routes require admin role
    if (path.startsWith("/admin")) {
      const user = await getSession(headers);
      if (user?.role !== "admin") {
        return error({ message: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
    }
    // Public routes (form viewing/submission) - no auth required
    return undefined;
  });
}

export const fragment: FormsFragment = createFormsServer(() => createPostgresPool());
