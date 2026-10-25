import Stripe from "stripe";

/** A Stripe API client for admin tooling. Subscription state goes through the Stripe fragment. */
export function createStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("Stripe admin client requires STRIPE_SECRET_KEY");
  }

  return new Stripe(stripeSecretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}
