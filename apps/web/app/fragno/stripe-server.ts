import { createStripeFragment } from "@fragno-dev/stripe";
import { createAdapter } from "./database-adapter.ts";
import {
  createPostgresClient,
  type DrizzleDatabase,
  createDrizzleDatabase,
} from "../db/postgres/is3a-postgres.ts";
import { createSimpleAuthServer } from "./simple-auth-server.ts";
import { UserRepo } from "~/db/repo/user.ts";

type StripeFragment = ReturnType<typeof createStripeFragment>;

export function createStripeServer(db: DrizzleDatabase | (() => DrizzleDatabase)): StripeFragment {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.warn("STRIPE_SECRET_KEY is not set");
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    console.warn("STRIPE_WEBHOOK_SECRET is not set");
  }

  const auth = createSimpleAuthServer(db);

  const userRepo = typeof db === "function" ? new UserRepo(db()) : new UserRepo(db);

  const getSession = async (headers: Headers) => {
    const response = await auth.callRoute("GET", "/me", { headers });

    if (response.type === "json" && response.data) {
      return response.data;
    }
    return null;
  };

  return createStripeFragment(
    {
      stripeSecretKey: stripeSecret || "stripe-secrets-unset",
      webhookSecret: stripeWebhookSecret || "stripe-secrets-unset",
      stripeClientOptions: {
        apiVersion: "2025-10-29.clover",
      },

      // Link Stripe customers to your users
      onStripeCustomerCreated: async (stripeCustomerId, referenceId) => {
        userRepo.setStripeCustomerId(referenceId, stripeCustomerId);
      },

      // Resolves the authenticated entity from the request
      resolveEntityFromRequest: async ({ headers }) => {
        const session = await getSession(headers);

        if (!session) {
          throw new Error("Unauthorized??");
        }
        // FIXME: Fetching user twice, in the userRepo and getSession
        const user = await userRepo.getUserById(session.userId);
        if (!user) {
          throw new Error("User not found");
        }

        return {
          referenceId: user.id,
          customerEmail: session.email,
          stripeCustomerId: user.stripeCustomerId ?? undefined,
          stripeMetadata: {},
        };
      },
      enableAdminRoutes: true,
    },
    {
      databaseAdapter: createAdapter(db),
    },
  ).withMiddleware(async ({ path, headers }, { error }) => {
    const user = await getSession(headers);

    if (path.startsWith("/admin") && (!user || user.role !== "admin")) {
      return error({ message: "Unauthorized", code: "UNAUTHORIZED" }, 401);
    }

    return undefined;
  });
}

export const fragment: StripeFragment = createStripeServer(() => {
  const client = createPostgresClient();
  return createDrizzleDatabase(client);
});
