import { createFragment, type FragnoPublicClientConfig } from "@fragno-dev/core";
import { createClientBuilder } from "@fragno-dev/core/client";
import {
  defineFragmentWithDatabase,
  type FragnoPublicConfigWithDatabase,
} from "@fragno-dev/db/fragment";
import { authSchema } from "./schema";
import { createUserServices, userRoutesFactory } from "./user/user";
import { createSessionServices, sessionRoutesFactory } from "./session/session";
import { createTotpServices, totpRoutesFactory } from "./totp/totp";
import { createOttServices, ottRoutesFactory } from "./ott/ott";

export interface AuthConfig {
  sendEmail?: (params: { to: string; subject: string; body: string }) => Promise<void>;
  issuer?: string;
}

export { OttType } from "./ott/ott";
export type { OttType as OttTypeEnum } from "./ott/ott";

export const authFragmentDefinition = defineFragmentWithDatabase<AuthConfig>("simple-auth")
  .withDatabase(authSchema)
  .withServices(({ orm, config }) => {
    const userServices = createUserServices(orm);
    const sessionServices = createSessionServices(orm);
    const totpServices = createTotpServices(orm, { issuer: config?.issuer });
    const ottServices = createOttServices(orm);

    return {
      ...userServices,
      ...sessionServices,
      ...totpServices,
      ...ottServices,
    };
  });

export function createAuthFragment(
  config: AuthConfig = {},
  fragnoConfig: FragnoPublicConfigWithDatabase,
) {
  return createFragment(
    authFragmentDefinition,
    config,
    [userRoutesFactory, sessionRoutesFactory, totpRoutesFactory, ottRoutesFactory],
    fragnoConfig,
  );
}

export function createAuthFragmentClients(fragnoConfig?: FragnoPublicClientConfig) {
  // Note: Cookies are automatically sent for same-origin requests by the browser.
  // For cross-origin requests, you may need to configure CORS headers on the server.
  const config = fragnoConfig || {};
  const baseUrl = config.baseUrl || "";
  const mountRoute = config.mountRoute || "/api/simple-auth";

  const b = createClientBuilder(
    authFragmentDefinition,
    config,
    [userRoutesFactory, sessionRoutesFactory, totpRoutesFactory, ottRoutesFactory],
    {
      type: "options",
      options: {
        credentials: "include",
      },
    },
  );

  // Helper to build full API URL
  const buildApiUrl = (path: string) => `${baseUrl}${mountRoute}${path}`;

  return {
    // Reactive hooks - Auth
    useSignUp: b.createMutator("POST", "/sign-up"),
    useSignIn: b.createMutator("POST", "/sign-in"),
    useSignOut: b.createMutator("POST", "/sign-out"),
    useMe: b.createHook("/me"),
    useSession: b.createHook("/me"),

    // Reactive hooks - TOTP
    useEnableTotp: b.createMutator("POST", "/totp/enable"),
    useVerifyTotp: b.createMutator("POST", "/totp/verify"),
    useVerifyBackupCode: b.createMutator("POST", "/totp/verify-backup"),
    useDisableTotp: b.createMutator("POST", "/totp/disable"),
    useTotpStatus: b.createHook("/totp/status"),

    // Reactive hooks - OTT
    useGenerateToken: b.createMutator("POST", "/ott/generate"),
    useValidateToken: b.createMutator("POST", "/ott/validate"),
    useCleanupTokens: b.createMutator("POST", "/ott/cleanup"),
    useInvalidateTokens: b.createMutator("POST", "/ott/invalidate"),

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
        const response = await fetch(buildApiUrl("/sign-in"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Sign in failed");
        }

        return response.json() as Promise<{
          sessionId: string;
          userId: string;
          email: string;
        }>;
      },
    },

    signUp: {
      email: async ({ email, password }: { email: string; password: string }) => {
        const response = await fetch(buildApiUrl("/sign-up"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Sign up failed");
        }

        return response.json() as Promise<{
          sessionId: string;
          userId: string;
          email: string;
        }>;
      },
    },

    signOut: async () => {
      const response = await fetch(buildApiUrl("/sign-out"), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign out failed");
      }

      return response.json() as Promise<{ success: boolean }>;
    },

    me: async () => {
      const response = await fetch(buildApiUrl("/me"), {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Me failed");
      }
    },
  };
}

export type { FragnoRouteConfig } from "@fragno-dev/core/api";
