import { z } from "zod";

export const BULK_IMPORT_SELECTION_LIMIT = 50;
export const BULK_IMPORT_BATCH_SIZE = 3;

export const stripeCustomerIdSchema = z
  .string()
  .trim()
  .regex(/^cus_[A-Za-z0-9]+$/);
export const bulkImportSelectionSchema = z
  .array(stripeCustomerIdSchema)
  .min(1)
  .max(BULK_IMPORT_SELECTION_LIMIT)
  .transform((ids) => [...new Set(ids)]);
export const bulkImportIdSchema = z.uuid();

export interface ImportCustomer {
  readonly id: string;
  readonly email: string | null;
  readonly name?: string | null;
  readonly created: number;
}

export interface ImportUser {
  readonly id: string;
  readonly email: string;
  readonly stripeCustomerId: string | null;
}

export interface CustomerLink {
  readonly customerId: string;
  readonly referenceId: string;
}

export interface CustomerSyncState {
  readonly customerId: string;
  readonly status: "pending" | "synced" | "error" | "unverified";
  readonly hookId?: string;
  readonly linked?: boolean;
  readonly error?: string;
}

export type ImportItemStatus =
  | "queued"
  | "processing"
  | "sync_pending"
  | "synced"
  | "error"
  | "conflict";

export interface ImportItem {
  readonly customerId: string;
  readonly status: ImportItemStatus;
  readonly userId?: string;
  readonly accountCreated: boolean;
  readonly linked: boolean;
  readonly error?: string;
}

export interface BulkImportJob {
  readonly id: string;
  readonly ownerId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly items: readonly ImportItem[];
}

export type BulkImportResponse =
  | { readonly success: true; readonly job: BulkImportJob }
  | { readonly success: false; readonly error: string };

export interface ImportSummary {
  created: number;
  linked: number;
  synced: number;
  pending: number;
  remaining: number;
  errors: number;
  complete: boolean;
}

export function summarizeImport(job: BulkImportJob): ImportSummary {
  return {
    created: job.items.filter((item) => item.accountCreated).length,
    linked: job.items.filter((item) => item.linked).length,
    synced: job.items.filter((item) => item.status === "synced").length,
    pending: job.items.filter((item) => item.status === "sync_pending").length,
    remaining: job.items.filter((item) => ["queued", "processing"].includes(item.status)).length,
    errors: job.items.filter((item) => ["error", "conflict"].includes(item.status)).length,
    complete: job.items.every((item) => item.status === "synced"),
  };
}
