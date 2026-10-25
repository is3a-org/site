import { and, eq, isNotNull, isNull } from "drizzle-orm";

import { customer_stripe, user_auth, subscription_stripe } from "~/db/postgres/fragno-schema";
import { type DrizzleDatabase } from "~/db/postgres/is3a-postgres";
import { user_stripe } from "~/db/postgres/postgres.schema";

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
  #db: DrizzleDatabase;

  constructor(db: DrizzleDatabase) {
    this.#db = db;
  }

  async getAllUsers(): Promise<UserMembershipSummary[]> {
    return await this.#db
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
      .orderBy(user_auth.email);
  }

  async setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
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
  async getUsersWithUnlinkedStripeCustomer(): Promise<UnlinkedStripeCustomer[]> {
    return await this.#db
      .select({
        userId: user_stripe.userId,
        stripeCustomerId: user_stripe.stripeCustomerId,
      })
      .from(user_stripe)
      .leftJoin(customer_stripe, eq(customer_stripe.referenceId, user_stripe.userId))
      .where(and(isNotNull(user_stripe.stripeCustomerId), isNull(customer_stripe.id)));
  }

  async getUserById(id: string): Promise<UserMembershipDetails | null> {
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
    return user.length === 1 ? user[0] : null;
  }

  async getUserByEmail(email: string): Promise<UserMembershipSummary | null> {
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
    return user.length === 1 ? user[0] : null;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<UserMembershipSummary | null> {
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
    return user.length === 1 ? user[0] : null;
  }
}
