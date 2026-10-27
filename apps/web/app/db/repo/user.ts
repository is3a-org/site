import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";

import {
  customer_stripe,
  fragno_hooks,
  user_auth,
  subscription_stripe,
} from "~/db/postgres/fragno-schema";
import type { DrizzleDatabase } from "~/db/postgres/is3a-postgres";
import { user_stripe } from "~/db/postgres/postgres.schema";
import type { CustomerLink, CustomerSyncState } from "~/lib/bulk-import";
import { resolveCustomerSyncState } from "~/lib/stripe-sync-state";

import { summarizeUserMemberships, type UserSubscriptionSummary } from "./user-memberships";

/** User membership summary with nullable fields from the Stripe left joins. */
export interface UserMembershipSummary extends Pick<
  typeof user_auth.$inferSelect,
  "id" | "email" | "createdAt"
> {
  stripeCustomerId: typeof user_stripe.$inferSelect.stripeCustomerId;
  subscriptionId: typeof subscription_stripe.$inferSelect.id | null;
  subscriptionStatus: typeof subscription_stripe.$inferSelect.status | null;
  subscriptionStripePriceId: typeof subscription_stripe.$inferSelect.priceId | null;
}

export interface UserMembershipWithHistory extends UserMembershipSummary {
  readonly role: typeof user_auth.$inferSelect.role;
  readonly subscriptions: readonly UserSubscriptionSummary[];
}

/** User membership details include the current subscription billing period. */
export interface UserMembershipDetails extends UserMembershipSummary {
  periodStart: typeof subscription_stripe.$inferSelect.currentPeriodStart | null;
  periodEnd: typeof subscription_stripe.$inferSelect.currentPeriodEnd | null;
  cancelAt: typeof subscription_stripe.$inferSelect.cancelAt;
  cancelAtPeriodEnd: typeof subscription_stripe.$inferSelect.cancelAtPeriodEnd | null;
}

/** Stripe customer link missing from the Stripe fragment's customer table. */
export type UnlinkedStripeCustomer = Pick<
  typeof user_stripe.$inferSelect,
  "userId" | "stripeCustomerId"
>;

export class UserRepo {
  readonly #db: DrizzleDatabase;

  public constructor(db: DrizzleDatabase) {
    this.#db = db;
  }

  public async getAllUsers(): Promise<UserMembershipWithHistory[]> {
    const rows = await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        role: user_auth.role,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.priceId,
        subscriptionPeriodEnd: subscription_stripe.currentPeriodEnd,
        subscriptionCreatedAt: subscription_stripe.createdAt,
        subscriptionCancelAtPeriodEnd: subscription_stripe.cancelAtPeriodEnd,
        subscriptionCancelAt: subscription_stripe.cancelAt,
        subscriptionEndedAt: subscription_stripe.endedAt,
      })
      .from(user_auth)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_auth.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_auth.id))
      .orderBy(user_auth.email);
    return summarizeUserMemberships(rows);
  }

  /** Inspect actual sync hooks, not merely the presence of an application customer link. */
  public async getStripeSyncStates(links: readonly CustomerLink[]): Promise<CustomerSyncState[]> {
    if (links.length === 0) {
      return [];
    }
    const ids = links.map((link) => link.customerId);
    const hookCustomerId = sql<string>`${fragno_hooks.payload}->>'customerId'`;
    const hookFilter = and(
      eq(fragno_hooks.namespace, "stripe"),
      eq(fragno_hooks.hookName, "syncCustomerSubscriptions"),
      inArray(hookCustomerId, ids),
    );
    const [customers, subscriptions, hooks] = await Promise.all([
      this.#db
        .select({ id: customer_stripe.id, referenceId: customer_stripe.referenceId })
        .from(customer_stripe)
        .where(inArray(customer_stripe.id, ids)),
      this.#db
        .select({
          customerId: subscription_stripe.customerId,
          referenceId: subscription_stripe.referenceId,
        })
        .from(subscription_stripe)
        .where(inArray(subscription_stripe.customerId, ids)),
      this.#db
        .selectDistinctOn([hookCustomerId], {
          customerId: hookCustomerId,
          id: fragno_hooks.id,
          status: fragno_hooks.status,
          error: fragno_hooks.error,
        })
        .from(fragno_hooks)
        .where(hookFilter)
        .orderBy(hookCustomerId, desc(fragno_hooks.createdAt), desc(fragno_hooks._internalId)),
    ]);
    return links.map((link) => {
      const customer = customers.find((row) => row.id === link.customerId);
      const hook = hooks.find((row) => row.customerId === link.customerId);
      const hasSubscriptions = subscriptions.some(
        (row) => row.customerId === link.customerId && row.referenceId === link.referenceId,
      );
      return resolveCustomerSyncState(link, customer?.referenceId, hook, hasSubscriptions);
    });
  }

  public async setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await this.#db
      .insert(user_stripe)
      .values({
        userId,
        stripeCustomerId,
      })
      .onConflictDoUpdate({
        target: user_stripe.userId,
        set: {
          stripeCustomerId,
        },
      });
  }

  /** Users linked to a Stripe customer that the Stripe fragment does not know about yet. */
  public async getUsersWithUnlinkedStripeCustomer(): Promise<UnlinkedStripeCustomer[]> {
    return this.#db
      .select({
        userId: user_stripe.userId,
        stripeCustomerId: user_stripe.stripeCustomerId,
      })
      .from(user_stripe)
      .leftJoin(customer_stripe, eq(customer_stripe.referenceId, user_stripe.userId))
      .where(and(isNotNull(user_stripe.stripeCustomerId), isNull(customer_stripe.id)));
  }

  public async getUserById(id: string): Promise<UserMembershipDetails | null> {
    const user = await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.priceId,
        periodStart: subscription_stripe.currentPeriodStart,
        periodEnd: subscription_stripe.currentPeriodEnd,
        cancelAt: subscription_stripe.cancelAt,
        cancelAtPeriodEnd: subscription_stripe.cancelAtPeriodEnd,
      })
      .from(user_auth)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_auth.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_auth.id))
      .where(eq(user_auth.id, id))
      .orderBy(subscription_stripe.status) // 'active' comes first
      .limit(1); // We've set "1 subscription per customer" setting in Stripe
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Repository lookups return null when no user matches, preserving their public nullable result contract.
    return user.length === 1 ? user[0] : null;
  }

  public async getUserByEmail(email: string): Promise<UserMembershipSummary | null> {
    const user = await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.priceId,
      })
      .from(user_auth)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_auth.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_auth.id))
      // Auth stores emails trimmed and lowercased
      .where(eq(user_auth.email, email.trim().toLowerCase()))
      .limit(1);
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Repository lookups return null when no user matches, preserving their public nullable result contract.
    return user.length === 1 ? user[0] : null;
  }

  public async getUserByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<UserMembershipSummary | null> {
    const user = await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.priceId,
      })
      .from(user_auth)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_auth.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_auth.id))
      .where(eq(user_stripe.stripeCustomerId, stripeCustomerId))
      .limit(1);
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Repository lookups return null when no user matches, preserving their public nullable result contract.
    return user.length === 1 ? user[0] : null;
  }
}
