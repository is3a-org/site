import { eq } from "drizzle-orm";
import { user_simple_auth_db, subscription_stripe } from "~/db/postgres/fragno-schema";
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
        id: user_simple_auth_db.id,
        email: user_simple_auth_db.email,
        createdAt: user_simple_auth_db.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
      })
      .from(user_simple_auth_db)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_simple_auth_db.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_simple_auth_db.id))
      .orderBy(user_simple_auth_db.email);
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

  // TODO: handle case where there are multiple subscriptions for one userId?

  async getUserById(id: string) {
    const user = await this.#db
      .select({
        id: user_simple_auth_db.id,
        email: user_simple_auth_db.email,
        createdAt: user_simple_auth_db.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
        periodStart: subscription_stripe.periodStart,
        periodEnd: subscription_stripe.periodEnd,
        cancelAt: subscription_stripe.cancelAt,
        cancelAtPeriodEnd: subscription_stripe.cancelAtPeriodEnd,
      })
      .from(user_simple_auth_db)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_simple_auth_db.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_simple_auth_db.id))
      .where(eq(user_simple_auth_db.id, id))
      .orderBy(subscription_stripe.status) // 'active' comes first
      .limit(1);
    return user.length === 1 ? user[0] : null;
  }

  async getUserByEmail(email: string) {
    const user = await this.#db
      .select({
        id: user_simple_auth_db.id,
        email: user_simple_auth_db.email,
        createdAt: user_simple_auth_db.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
      })
      .from(user_simple_auth_db)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_simple_auth_db.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_simple_auth_db.id))
      .where(eq(user_simple_auth_db.email, email))
      .limit(1);
    return user.length === 1 ? user[0] : null;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string) {
    const user = await this.#db
      .select({
        id: user_simple_auth_db.id,
        email: user_simple_auth_db.email,
        createdAt: user_simple_auth_db.createdAt,
        stripeCustomerId: user_stripe.stripeCustomerId,
        subscriptionId: subscription_stripe.id,
        subscriptionStatus: subscription_stripe.status,
        subscriptionStripePriceId: subscription_stripe.stripePriceId,
      })
      .from(user_simple_auth_db)
      .leftJoin(user_stripe, eq(user_stripe.userId, user_simple_auth_db.id))
      .leftJoin(subscription_stripe, eq(subscription_stripe.referenceId, user_simple_auth_db.id))
      .where(eq(user_stripe.stripeCustomerId, stripeCustomerId))
      .limit(1);
    return user.length === 1 ? user[0] : null;
  }
}
