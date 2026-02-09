import { eq } from "drizzle-orm";
import { user_auth, subscription_stripe } from "~/db/postgres/fragno-schema";
import { user_stripe } from "~/db/postgres/postgres.schema";
import { type DrizzleDatabase } from "~/db/postgres/is3a-postgres";

export class UserRepo {
  #db: DrizzleDatabase;

  constructor(db: DrizzleDatabase) {
    this.#db = db;
  }

  async getAllUsers() {
    return await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
      })
      .from(user_auth)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_auth.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_auth.id))
      .orderBy(user_auth.email);
  }

  async setStripeCustomerId(userId: string, stripeCustomerId: string) {
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

  async getUserById(id: string) {
    const user = await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
        periodStart: subscription_stripe.periodStart,
        periodEnd: subscription_stripe.periodEnd,
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

  async getUserByEmail(email: string) {
    const user = await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
      })
      .from(user_auth)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_auth.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_auth.id))
      .where(eq(user_auth.email, email))
      .limit(1);
    return user.length === 1 ? user[0] : null;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string) {
    const user = await this.#db
      .select({
        id: user_auth.id,
        email: user_auth.email,
        createdAt: user_auth.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
      })
      .from(user_auth)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_auth.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_auth.id))
      .where(eq(user_stripe.stripeCustomerId, stripeCustomerId))
      .limit(1);
    return user.length === 1 ? user[0] : null;
  }
}
