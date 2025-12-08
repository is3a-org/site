import { createAuthFragment } from "@is3a/simple-auth-fragment";
import { createAdapter } from "./database-adapter.ts";
import { createPostgresPool, type PostgresPool } from "../db/postgres/is3a-postgres.ts";

export function createSimpleAuthServer(pool: PostgresPool | (() => PostgresPool)) {
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
    },
  );
}

export const fragment = createSimpleAuthServer(() => {
  return createPostgresPool();
});
