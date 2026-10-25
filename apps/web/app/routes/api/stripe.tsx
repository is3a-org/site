import { getStripeFragment } from "~/fragno/stripe-durable-object";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/stripe";

// The Stripe fragment runs in a Durable Object so its webhook events get processed
export async function loader({ request, context }: Readonly<Route.LoaderArgs>): Promise<Response> {
  return getStripeFragment(context.get(requestContext).cloudflare.env).fetch(request);
}

export async function action({ request, context }: Readonly<Route.ActionArgs>): Promise<Response> {
  return getStripeFragment(context.get(requestContext).cloudflare.env).fetch(request);
}
