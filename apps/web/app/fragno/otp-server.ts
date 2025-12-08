import { createOtpFragment } from "@is3a/one-time-password-fragment";
import { createAdapter } from "./database-adapter.ts";
import { createPostgresPool, type PostgresPool } from "../db/postgres/is3a-postgres.ts";

export function createOtpServer(pool: PostgresPool | (() => PostgresPool)) {
  return createOtpFragment(
    {
      sendEmail: async ({ to, subject, body }) => {
        console.log(`Sending email to ${to} with subject ${subject} and body ${body}`);
      },
      issuer: "IS3A",
    },
    {
      databaseAdapter: createAdapter(pool),
    },
  );
}

export const fragment = createOtpServer(() => {
  return createPostgresPool();
});
