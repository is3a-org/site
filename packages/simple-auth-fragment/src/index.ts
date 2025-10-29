import { createFragment, type FragnoPublicClientConfig } from "@fragno-dev/core";
import { createClientBuilder } from "@fragno-dev/core/client";
import {
  defineFragmentWithDatabase,
  type FragnoPublicConfigWithDatabase,
} from "@fragno-dev/db/fragment";
import { authSchema } from "./schema";
import { createUserServices, userRoutesFactory } from "./user/user";
import { createSessionServices, sessionRoutesFactory } from "./session/session";

export interface AuthConfig {
  sendEmail?: (params: { to: string; subject: string; body: string }) => Promise<void>;
}

export const authFragmentDefinition = defineFragmentWithDatabase<AuthConfig>("simple-auth")
  .withDatabase(authSchema)
  .withServices(({ orm }) => {
    const userServices = createUserServices(orm);
    const sessionServices = createSessionServices(orm);

    return {
      ...userServices,
      ...sessionServices,
    };
  });

export function createAuthFragment(
  config: AuthConfig = {},
  fragnoConfig: FragnoPublicConfigWithDatabase,
) {
  return createFragment(
    authFragmentDefinition,
    config,
    [userRoutesFactory, sessionRoutesFactory],
    fragnoConfig,
  );
}

export function createAuthFragmentClients(fragnoConfig: FragnoPublicClientConfig) {
  const b = createClientBuilder(authFragmentDefinition, fragnoConfig, [
    userRoutesFactory,
    sessionRoutesFactory,
  ]);

  return {
    useSignUp: b.createMutator("POST", "/sign-up"),
    useSignIn: b.createMutator("POST", "/sign-in"),
    useSignOut: b.createMutator("POST", "/sign-out"),
    useMe: b.createHook("/me"),
  };
}

export type { FragnoRouteConfig } from "@fragno-dev/core/api";
