import { defineRoute, defineRoutes } from "@fragno-dev/core";
import { z } from "zod";

import type { StripeFragmentConfig, StripeFragmentDeps, StripeFragmentServices } from "../types";
import { SubscriptionReponseSchema } from "../models/subscriptions";

export const subscriptionsRoutesFactory = defineRoutes<
  StripeFragmentConfig,
  StripeFragmentDeps,
  StripeFragmentServices
>().create(({ services }) => {
  return [
    defineRoute({
      method: "GET",
      path: "/subscriptions",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .default(20)
          .describe("Number of subscriptions to return (max 100)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .default(0)
          .describe("Number of subscriptions to skip for pagination"),
      }),
      outputSchema: z.object({
        subscriptions: z.array(SubscriptionReponseSchema),
      }),
      handler: async (_, { json }) => {
        return json({
          subscriptions: await services.getAllSubscriptions(),
        });
      },
    }),
  ];
});
