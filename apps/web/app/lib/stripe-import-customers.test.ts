import { expect, it } from "vite-plus/test";

import type { ImportCustomer } from "./bulk-import";
import { collectStripeImportCustomers } from "./stripe-import-customers";

async function* customerPages(): AsyncGenerator<ImportCustomer> {
  await Promise.resolve();
  for (let index = 0; index < 205; index++) {
    yield {
      id: `cus_${index}`,
      email: `member${index}@example.com`,
      name: `Member ${index}`,
      created: index,
    };
  }
}

it("includes customers after the first 100-record Stripe page", async () => {
  const customers = await collectStripeImportCustomers(customerPages());
  expect(customers).toHaveLength(205);
  expect(customers.at(-1)?.id).toBe("cus_204");
});
