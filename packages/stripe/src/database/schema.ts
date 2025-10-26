import { schema, idColumn, column } from "@fragno-dev/db/schema";

export const stripeSchema = schema((s) => {
  return s.addTable("subscription", (t) => {
    return t
      .addColumn("id", idColumn())
      .addColumn("plan", column("string"))
      .addColumn("referenceId", column("string"))
      .addColumn("stripeCustomerId", column("string").nullable())
      .addColumn("stripeSubscriptionId", column("string").nullable())
      .addColumn("status", column("string").defaultTo("incomplete"))
      .addColumn("periodStart", column("timestamp").nullable())
      .addColumn("periodEnd", column("timestamp").nullable())
      .addColumn("trialStart", column("timestamp").nullable())
      .addColumn("trialEnd", column("timestamp").nullable())
      .addColumn("cancelAtPeriodEnd", column("bool").defaultTo(false))
      .addColumn("seats", column("integer").nullable())
      .addColumn(
        "createdAt",
        column("timestamp").defaultTo((b) => b.now()),
      )
      .addColumn(
        "updatedAt",
        column("timestamp").defaultTo((b) => b.now()),
      )
      .createIndex("idx_stripe_customer_id", ["stripeCustomerId"])
      .createIndex("idx_stripe_subscription_id", ["stripeSubscriptionId"]);
  });
});
