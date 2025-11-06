import { createStripeFragmentClient } from "@fragno-dev/stripe/react";

export const stripeFragmentClient: ReturnType<typeof createStripeFragmentClient> =
  createStripeFragmentClient();
