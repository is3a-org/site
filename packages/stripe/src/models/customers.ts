import { z } from "zod";
import {} from "stripe";

export const CustomerResponseSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  created: z.number(),
  metadata: z.record(z.string(), z.string()),
});

export type CustomerResponseSchema = z.infer<typeof CustomerResponseSchema>;
