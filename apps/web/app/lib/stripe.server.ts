import Stripe from "stripe";

/** A Stripe API client for admin tooling. Subscription state goes through the Stripe fragment. */
export function createStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    httpClient: Stripe.createFetchHttpClient(),
  });
}
