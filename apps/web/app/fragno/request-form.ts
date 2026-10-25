import { z } from "zod";

const formTextSchema = z.string();
const customerIdListSchema = z.array(z.string());

/** Reads a text form field without treating uploaded files as authentication or billing text. */
export function readFormText(formData: FormData, fieldName: string): string | undefined {
  const result = formTextSchema.safeParse(formData.get(fieldName));
  return result.success ? result.data : undefined;
}

/** Validates the JSON list of Stripe customer IDs before a bulk billing import begins. */
export function parseStripeCustomerIds(customerIdsJson: string): string[] {
  return customerIdListSchema.parse(JSON.parse(customerIdsJson));
}
