import { createOtpFragment, type OtpFragment } from "@is3a/one-time-password-fragment";

import { createPostgresPool, type PostgresPool } from "../db/postgres/is3a-postgres.ts";
import { createAdapter } from "./database-adapter.ts";

export function createOtpServer(pool: PostgresPool | (() => PostgresPool)): OtpFragment {
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
