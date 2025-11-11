import { createAuthFragment } from "@is3a/simple-auth-fragment";
import { createAdapter } from "./database-adapter.ts";
import {
  createPostgresClient,
  type DrizzleDatabase,
  createDrizzleDatabase,
} from "../db/postgres/is3a-postgres.ts";

export function createSimpleAuthServer(db: DrizzleDatabase | (() => DrizzleDatabase)) {
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
      databaseAdapter: createAdapter(db),
    },
  );
}

export const fragment = createSimpleAuthServer(() => {
  const client = createPostgresClient();
  return createDrizzleDatabase(client);
});
