import type { AuthMeResponse } from "@fragno-dev/auth";
import { createStripeFragment } from "@fragno-dev/stripe";

import { UserRepo } from "~/db/repo/user.ts";

import {
  createPostgresPool,
  resolvePostgresPool,
  createDrizzleDatabase,
  type PostgresPool,
} from "../db/postgres/is3a-postgres.ts";
import { createAdapter } from "./database-adapter.ts";
import { createSimpleAuthServer } from "./simple-auth-server.ts";

type StripeFragment = ReturnType<typeof createStripeFragment>;

/**
 * Creates the Stripe fragment. The fragment processes webhooks with durable hooks, so requests and
 * service calls that write to it must go through `StripeFragmentDurableObject`, which hosts the
 * hook dispatcher. See `~/fragno/stripe-durable-object.ts`.
 */
export function createStripeServer(pool: PostgresPool | (() => PostgresPool)): StripeFragment {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.warn("STRIPE_SECRET_KEY is not set");
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    console.warn("STRIPE_WEBHOOK_SECRET is not set");
  }

  const resolvedPool = resolvePostgresPool(pool);
  const auth = createSimpleAuthServer(resolvedPool);

  const db = createDrizzleDatabase(resolvedPool);
  const userRepo = new UserRepo(db);

  const getSession = async (headers: Headers): Promise<AuthMeResponse["user"] | null> => {
    const response = await auth.callRoute("GET", "/me", { headers });

    if (response.type === "json") {
      return response.data.user;
    }
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Stripe entity resolution and authentication session lookup require null for an unauthenticated request.
    return null;
  };

  return createStripeFragment(
    {
      stripeSecretKey: stripeSecret || "stripe-secrets-unset",
      webhookSecret: stripeWebhookSecret || "stripe-secrets-unset",

      // Keep the app's own user -> Stripe customer link in sync with the fragment's
      onCustomerLinked: async ({ customerId, referenceId }) => {
        await userRepo.setStripeCustomerId(referenceId, customerId);
      },

      // Resolves the authenticated entity from the request
      resolveEntityFromRequest: async ({ headers }) => {
        const user = await getSession(headers);
        if (!user) {
          // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Stripe entity resolution and authentication session lookup require null for an unauthenticated request.
          return null;
        }

        return {
          referenceId: user.id,
          customerEmail: user.email,
          customerMetadata: {},
        };
      },
    },
    {
      databaseAdapter: createAdapter(resolvedPool),
    },
  ).withMiddleware(async ({ path, headers }, { error }): Promise<Response | undefined> => {
    if (path.startsWith("/admin")) {
      const user = await getSession(headers);
      if (user?.role !== "admin") {
        return error({ message: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
    }

    return undefined;
  });
}

export const fragment: StripeFragment = createStripeServer(() => {
  return createPostgresPool();
});
