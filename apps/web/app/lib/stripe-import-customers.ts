import type { ImportCustomer } from "./bulk-import";

/** Consume every SDK page; a single customers.list response silently truncates at 100. */
export async function collectStripeImportCustomers(
  customers: AsyncIterable<ImportCustomer>,
): Promise<ImportCustomer[]> {
  const result: ImportCustomer[] = [];
  for await (const { id, email, name, created } of customers) {
    result.push({ id, email, name, created });
  }
  return result;
}
