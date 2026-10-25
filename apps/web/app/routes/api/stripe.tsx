import { getStripeFragment } from "~/fragno/stripe-durable-object";

import type { Route } from "./+types/stripe";

// The Stripe fragment runs in a Durable Object so its webhook events get processed
export async function loader({ request, context }: Route.LoaderArgs) {
  return getStripeFragment(context.cloudflare.env).fetch(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  return getStripeFragment(context.cloudflare.env).fetch(request);
}
