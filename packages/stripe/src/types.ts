import type Stripe from "stripe";
import type { TableToInsertValues } from "@fragno-dev/db/query";
import type { stripeSchema } from "./database/schema";
import type { SubscriptionResponse } from "./models/subscriptions";

export interface StripeFragmentConfig {
  stripeSecretKey: string;
  webhookSecret: string;
  stripeClientOptions?: Stripe.StripeConfig;
}

export interface StripeFragmentDeps {
  stripe: Stripe;
  stripeClientOptions?: Stripe.StripeConfig;
}

export interface StripeFragmentServices {
  /**
   * Get the Stripe client instance
   */
  getStripeClient(): Stripe;
  /**
   * Create a new subscription record in the database
   */
  createSubscription(
    data: Omit<TableToInsertValues<typeof stripeSchema.tables.subscription>, "id">,
  ): Promise<{ id: string } & typeof data>;
  /**
   * Update an existing subscription record
   */
  updateSubscription(
    id: string,
    data: Partial<Omit<TableToInsertValues<typeof stripeSchema.tables.subscription>, "id">>,
  ): Promise<void>;
  /**
   * Find a subscription by Stripe subscription ID
   */
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<SubscriptionResponse | null>;
  /**
   * Find all subscriptions for a Stripe customer ID
   */
  getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<SubscriptionResponse[]>;
  /**
   * Delete a subscription record
   */
  deleteSubscription(id: string): Promise<void>;
  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): Promise<SubscriptionResponse[]>;
}
