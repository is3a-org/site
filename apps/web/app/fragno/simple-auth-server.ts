import { createAuthFragment } from "@is3a/simple-auth-fragment";
import { createAdapter } from "./database-adapter.ts";
import {
  createDrizzleDatabase,
  createPostgresClient,
  type DrizzleDatabase,
} from "../db/postgres/is3a-postgres.ts";

export function createSimpleAuthServer(db: DrizzleDatabase | (() => DrizzleDatabase)) {
  return createAuthFragment(
    {
      sendEmail: async ({ to, subject, body }) => {
        console.log(`Sending email to ${to} with subject ${subject} and body ${body}`);
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
