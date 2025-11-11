import {
  createFragment,
  instantiateFragment,
  type FragnoPublicClientConfig,
} from "@fragno-dev/core";
import { createClientBuilder } from "@fragno-dev/core/client";
import {
  defineFragmentWithDatabase,
  type FragnoPublicConfigWithDatabase,
} from "@fragno-dev/db/fragment";
import { authSchema } from "./schema";
import { createUserServices, userActionsRoutesFactory } from "./user/user-actions";
import { createSessionServices, sessionRoutesFactory } from "./session/session";
import {
  createUserOverviewServices,
  userOverviewRoutesFactory,
  type GetUsersParams,
  type UserResult,
  type SortField,
  type SortOrder,
} from "./user/user-overview";
import type { CookieOptions } from "./utils/cookie";

export interface AuthConfig {
  sendEmail?: (params: { to: string; subject: string; body: string }) => Promise<void>;
  cookieOptions?: CookieOptions;
}

export const authFragmentDefinition = defineFragmentWithDatabase<AuthConfig>("simple-auth")
  .withDatabase(authSchema)
  .providesService(({ db }) => {
    const userServices = createUserServices(db);
    const sessionServices = createSessionServices(db);
    const userOverviewServices = createUserOverviewServices(db);

    return {
      ...userServices,
      ...sessionServices,
      ...userOverviewServices,
    };
  });

export type AuthFragment = typeof authFragmentDefinition;

export function createAuthFragment(
  config: AuthConfig = {},
  fragnoConfig: FragnoPublicConfigWithDatabase,
) {
  console.log({ instantiateFragment });
  return createFragment(
    authFragmentDefinition,
    config,
    [userActionsRoutesFactory, sessionRoutesFactory, userOverviewRoutesFactory],
    fragnoConfig,
  );
}

export function createAuthFragmentClients(fragnoConfig?: FragnoPublicClientConfig) {
  // Note: Cookies are automatically sent for same-origin requests by the browser.
  // For cross-origin requests, you may need to configure CORS headers on the server.
  const config = fragnoConfig || {};

  const b = createClientBuilder(
    authFragmentDefinition,
    config,
    [userActionsRoutesFactory, sessionRoutesFactory, userOverviewRoutesFactory],
    {
      type: "options",
      options: {
        credentials: "include",
      },
    },
  );

  const { fetcher, defaultOptions } = b.getFetcher();

  const useMe = b.createHook("/me");
  const useSignOut = b.createMutator("POST", "/sign-out");
  const useUsers = b.createHook("/users");
  const useUpdateUserRole = b.createMutator("PATCH", "/users/:userId/role");

  return {
    // Reactive hooks - Auth
    useSignUp: b.createMutator("POST", "/sign-up"),
    useSignIn: b.createMutator("POST", "/sign-in"),
    useSignOut,
    useMe,
    useUsers,
    useUpdateUserRole,

    // Non-reactive methods
    signIn: {
      email: async ({
        email,
        password,
        rememberMe: _rememberMe,
      }: {
        email: string;
        password: string;
        rememberMe?: boolean;
      }) => {
        // Note: rememberMe is accepted but not yet implemented on the backend
        const response = await fetcher("/sign-in", {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Sign in failed");
        }

        return response.json() as Promise<{
          sessionId: string;
          userId: string;
          email: string;
          role: Role;
        }>;
      },
    },

    signUp: {
      email: async ({ email, password }: { email: string; password: string }) => {
        const response = await fetcher("/sign-up", {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Sign up failed");
        }

        return response.json() as Promise<{
          sessionId: string;
          userId: string;
          email: string;
          role: Role;
        }>;
      },
    },

    signOut: () => {
      return useSignOut.mutateQuery({ body: {} });
    },

    me: async () => {
      const response = await fetcher("/me", {
        ...defaultOptions,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Me failed");
      }
    },
  };
}

export type { FragnoRouteConfig } from "@fragno-dev/core/api";
export type { GetUsersParams, UserResult, SortField, SortOrder };

export type Role = "user" | "admin";
