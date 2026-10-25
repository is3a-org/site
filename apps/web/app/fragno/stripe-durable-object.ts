import {
  createFragmentDurableObjectHost,
  type FragmentDurableObjectHost,
} from "@fragno-dev/db/dispatchers/cloudflare-do/fragment-durable-object";
import { DurableObject } from "cloudflare:workers";

import type { LinkCustomerResult, StripeCustomerLink, Subscription } from "@fragno-dev/stripe";

import { createDrizzleDatabase, createPostgresPool } from "~/db/postgres/is3a-postgres";
import { UserRepo } from "~/db/repo/user";

import { createFormsServer } from "./forms-server";
import { createSimpleAuthServer } from "./simple-auth-server";
import { createStripeServer } from "./stripe-server";

function createRuntime() {
  const pool = createPostgresPool();
  return {
    userRepo: new UserRepo(createDrizzleDatabase(pool)),
    stripe: createStripeServer(pool),
    // Auth and forms queue durable hooks on every sign-in and submission. The app registers no
    // callbacks for them, but this dispatcher drains them so they do not pile up as pending.
    auth: createSimpleAuthServer(pool),
    forms: createFormsServer(pool),
  };
}

type Runtime = ReturnType<typeof createRuntime>;

/**
 * Hosts the Stripe fragment and the durable hook dispatcher that processes its webhook events.
 *
 * The dispatcher is only notified of new hooks by fragments hosted here, so every Stripe route and
 * every Stripe service call that writes must go through this object. Use `getStripeFragment()`.
 */
export class StripeFragmentDurableObject extends DurableObject<CloudflareEnv> {
  #host: FragmentDurableObjectHost<void, Runtime>;
  #runtime!: Runtime;

  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);

    this.#host = createFragmentDurableObjectHost<CloudflareEnv, void, Runtime>({
      name: "stripe",
      state: ctx,
      env,
      createRuntime,
      // Drizzle owns the schema, see app/db/postgres/migrations
      getMigrationFragments: () => [],
      getHookFragments: (runtime) => [runtime.stripe, runtime.auth, runtime.forms],
      hostRuntime: (runtime, { hostFragment }) => ({
        ...runtime,
        stripe: hostFragment(runtime.stripe),
      }),
      mounts: [{ id: "stripe", target: (runtime) => runtime.stripe }],
    });

    void ctx.blockConcurrencyWhile(async () => {
      this.#runtime = await this.#host.initialize();
      await this.#linkStripeCustomers();
    });
  }

  override async fetch(request: Request): Promise<Response> {
    return await this.#host.fetch(this.#runtime, request);
  }

  override async alarm(): Promise<void> {
    await this.#host.alarm();
  }

  async getSubscriptionsByReferenceId(referenceId: string): Promise<Subscription[]> {
    const { stripe } = this.#runtime;
    return await stripe.callServices(() =>
      stripe.services.getSubscriptionsByReferenceId(referenceId),
    );
  }

  async syncSubscriptions(referenceId: string): Promise<void> {
    const { stripe } = this.#runtime;
    await stripe.callServices(() => stripe.services.syncSubscriptions(referenceId));
  }

  async linkCustomer(link: StripeCustomerLink): Promise<LinkCustomerResult> {
    const { stripe } = this.#runtime;
    return await stripe.callServices(() => stripe.services.linkCustomer(link));
  }

  /**
   * Links customers recorded in `user_stripe` that the Stripe fragment does not know about, such as
   * those linked before the fragment kept its own links. Linking syncs their subscriptions.
   */
  async #linkStripeCustomers() {
    try {
      const unlinked = await this.#runtime.userRepo.getUsersWithUnlinkedStripeCustomer();
      for (const { userId, stripeCustomerId } of unlinked) {
        if (!stripeCustomerId) {
          continue;
        }
        const result = await this.linkCustomer({
          customerId: stripeCustomerId,
          referenceId: userId,
        });
        if (!result.ok) {
          console.warn(
            `Could not link Stripe customer ${stripeCustomerId} to user ${userId}: ${result.code}`,
          );
        }
      }
    } catch (error) {
      console.error("Linking Stripe customers failed", error);
    }
  }
}

export function getStripeFragment(env: CloudflareEnv) {
  return env.STRIPE_FRAGMENT.getByName("stripe");
}

/**
 * Links a user to an existing Stripe customer and syncs their subscriptions right away.
 * Returns an error message when either side is already linked elsewhere.
 */
export async function linkStripeCustomer(
  env: CloudflareEnv,
  userRepo: UserRepo,
  link: StripeCustomerLink,
): Promise<string | null> {
  const stripe = getStripeFragment(env);

  const result = await stripe.linkCustomer(link);
  if (!result.ok) {
    return result.code === "REFERENCE_ALREADY_LINKED"
      ? `User ${link.referenceId} is already linked to another Stripe customer`
      : `Stripe customer ${link.customerId} is already linked to another user`;
  }

  // The fragment's onCustomerLinked hook records this too, but only once the hook has run
  await userRepo.setStripeCustomerId(link.referenceId, link.customerId);
  await stripe.syncSubscriptions(link.referenceId);
  return null;
}
