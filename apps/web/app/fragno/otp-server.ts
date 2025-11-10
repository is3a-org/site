import { createOtpFragment } from "@is3a/one-time-password-fragment";
import { createAdapter } from "./database-adapter.ts";
import {
  createPostgresClient,
  type DrizzleDatabase,
  createDrizzleDatabase,
} from "../db/postgres/is3a-postgres.ts";

export function createOtpServer(db: DrizzleDatabase | (() => DrizzleDatabase)) {
  return createOtpFragment(
    {
      sendEmail: async ({ to, subject, body }) => {
        console.log(`Sending email to ${to} with subject ${subject} and body ${body}`);
      },
      issuer: "IS3A",
    },
    {
      databaseAdapter: createAdapter(db),
    },
  );
}

export const fragment = createOtpServer(() => {
  const client = createPostgresClient();
  return createDrizzleDatabase(client);
});
