import { createStripeFragment } from "@fragno-dev/stripe";
import { createAdapter } from "./database-adapter";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  console.warn("STRIPE_SECRET_KEY is not set");
}

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!stripeWebhookSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET is not set");
}

export const fragment = createStripeFragment(
  {
    stripeSecretKey: stripeSecret || "stripe-secrets-unset",
    webhookSecret: stripeWebhookSecret || "stripe-secrets-unset",
    stripeClientOptions: {
      apiVersion: "2025-09-30.clover",
    },
  },
  { databaseAdapter: createAdapter() },
);
