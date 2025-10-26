import { createFragment, type FragnoPublicClientConfig } from "@fragno-dev/core";
import { createClientBuilder } from "@fragno-dev/core/client";
import type { AbstractQuery, TableToInsertValues } from "@fragno-dev/db/query";

import {
  defineFragmentWithDatabase,
  type FragnoPublicConfigWithDatabase,
} from "@fragno-dev/db/fragment";

import Stripe from "stripe";
import type { StripeFragmentConfig, StripeFragmentDeps, StripeFragmentServices } from "./types";
import { stripeSchema } from "./database/schema";
import { subscriptionsRoutesFactory } from "./routes/subscriptions";
import { customersRoutesFactory } from "./routes/customers";

const stripeFragmentDefinition = defineFragmentWithDatabase<StripeFragmentConfig>("stripe")
  .withDatabase(stripeSchema, "stripe")
  .withDependencies(({ config }): StripeFragmentDeps => {
    const stripeClient = new Stripe(config.stripeSecretKey, config.stripeClientOptions ?? {});

    return {
      stripe: stripeClient,
    };
  })
  .withServices(({ deps, orm }) => {
    return {
      getStripeClient(): Stripe {
        return deps.stripe;
      },
      ...createStripeServices(orm),
    };
  });

function createStripeServices(orm: AbstractQuery<typeof stripeSchema>) {
  return {
    createSubscription: async (
      data: Omit<TableToInsertValues<typeof stripeSchema.tables.subscription>, "id">,
    ) => {
      const id = await orm.create("subscription", data);
      return { id: id.toJSON(), ...data };
    },
    updateSubscription: async (
      id: string,
      data: Partial<Omit<TableToInsertValues<typeof stripeSchema.tables.subscription>, "id">>,
    ) => {
      await orm.update("subscription", id, (b) => b.set(data));
    },
    getSubscriptionByStripeId: async (stripeSubscriptionId: string) => {
      const results = await orm.findFirst("subscription", (b) =>
        b.whereIndex("idx_stripe_subscription_id", (eb) =>
          eb("stripeSubscriptionId", "=", stripeSubscriptionId),
        ),
      );

      return results;
    },
    getSubscriptionByStripeCustomerId: async (stripeCustomerId: string) => {
      return orm.find("subscription", (b) =>
        b.whereIndex("idx_stripe_customer_id", (eb) =>
          eb("stripeCustomerId", "=", stripeCustomerId),
        ),
      );
    },

    deleteSubscription: async (id: string) => {
      await orm.delete("subscription", id);
    },

    getAllSubscriptions: async () => {
      return await orm.find("subscription", (b) => b.whereIndex("primary"));
    },
  };
}

export function createStripeFragment(
  config: StripeFragmentConfig,
  fragnoConfig: FragnoPublicConfigWithDatabase,
) {
  return createFragment(
    stripeFragmentDefinition,
    config,
    [subscriptionsRoutesFactory, customersRoutesFactory],
    fragnoConfig,
  );
}

export function createStripeFragmentClients(fragnoConfig: FragnoPublicClientConfig = {}) {
  const builder = createClientBuilder(stripeFragmentDefinition, fragnoConfig, [
    subscriptionsRoutesFactory,
    customersRoutesFactory,
  ]);

  return {
    useSubscription: builder.createHook("/subscriptions"),
    useCustomer: builder.createHook("/customers"),
  };
}

export type { StripeFragmentConfig, StripeFragmentDeps, StripeFragmentServices } from "./types";
export type { FragnoRouteConfig } from "@fragno-dev/core/api";
