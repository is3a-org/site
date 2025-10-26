import { createAuthFragment } from "@is3a/simple-auth-fragment";
import { createAdapter } from "./database-adapter.ts";

export function createSimpleAuthServer() {
  return createAuthFragment(
    {
      sendEmail: async ({ to, subject, body }) => {
        console.log(`Sending email to ${to} with subject ${subject} and body ${body}`);
      },
    },
    {
      databaseAdapter: createAdapter(),
    },
  );
}

export const fragment = createSimpleAuthServer();
