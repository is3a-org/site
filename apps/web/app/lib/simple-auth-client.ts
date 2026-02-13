import { createAuthFragmentClient } from "@fragno-dev/auth/react";

export const simpleAuthClient: ReturnType<typeof createAuthFragmentClient> =
  createAuthFragmentClient({
    mountRoute: "/api/simple-auth",
  });
