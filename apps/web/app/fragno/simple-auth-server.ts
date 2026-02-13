import { createAuthFragment } from "@fragno-dev/auth";
import { createAdapter } from "./database-adapter.ts";
import { createPostgresPool, type PostgresPool } from "../db/postgres/is3a-postgres.ts";

export function createSimpleAuthServer(
  pool: PostgresPool | (() => PostgresPool),
): ReturnType<typeof createAuthFragment> {
  return createAuthFragment(
    {
      sendEmail: async ({ to, subject, body }) => {
        console.log(`Sending email to ${to} with subject ${subject} and body ${body}`);
      },
      cookieOptions: {
        sameSite: "Lax", // Needed because Stripe will redirect back to us and we lose auth otherwise
      },
    },
    {
      databaseAdapter: createAdapter(pool),
      databaseNamespace: "auth",
      mountRoute: "/api/simple-auth",
    },
  );
}

export const fragment: ReturnType<typeof createAuthFragment> = createSimpleAuthServer(() => {
  return createPostgresPool();
});
