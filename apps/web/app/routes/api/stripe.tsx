import { createStripeServer } from "~/fragno/stripe-server";
import type { Route } from "./+types/stripe";

export async function loader({ request, context }: Route.LoaderArgs) {
  return createStripeServer(context.db).handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  return createStripeServer(context.db).handler(request);
}
