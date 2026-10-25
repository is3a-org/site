import { expectTypeOf, it } from "vite-plus/test";

import type { Subscription } from "@fragno-dev/stripe";

import type { UserMembershipDetails, UserMembershipSummary, UserRepo } from "../db/repo/user";
import type { loader as membershipLoader } from "../routes/dashboard/membership";
import type { action as stripeCustomerAction } from "../routes/dashboard/stripe";
import type { linkStripeCustomer } from "./stripe-durable-object";

it("preserves null for repository lookups that have no matching user", () => {
  expectTypeOf<ReturnType<UserRepo["getUserById"]>>().toEqualTypeOf<
    Promise<UserMembershipDetails | null>
  >();
  expectTypeOf<ReturnType<UserRepo["getUserByEmail"]>>().toEqualTypeOf<
    Promise<UserMembershipSummary | null>
  >();
  expectTypeOf<ReturnType<UserRepo["getUserByStripeCustomerId"]>>().toEqualTypeOf<
    Promise<UserMembershipSummary | null>
  >();
});

it("preserves nullable billing errors and membership loader data", () => {
  expectTypeOf<ReturnType<typeof linkStripeCustomer>>().toEqualTypeOf<Promise<string | null>>();
  expectTypeOf<
    Awaited<ReturnType<typeof membershipLoader>>["subscription"]
  >().toEqualTypeOf<Subscription | null>();
});

it("preserves explicit JSON nulls when a Stripe customer has no matching user", () => {
  expectTypeOf<
    Extract<Awaited<ReturnType<typeof stripeCustomerAction>>, { matchType: null }>
  >().toEqualTypeOf<{ success: true; user: null; matchType: null }>();
});
