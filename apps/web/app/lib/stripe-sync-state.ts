import type { CustomerLink, CustomerSyncState } from "./bulk-import";

export interface StoredSyncHook {
  readonly id: string;
  readonly status: string;
  readonly error: string | null;
}

/** A link alone is never proof of a completed sync, and newer failures supersede old rows. */
export function resolveCustomerSyncState(
  link: CustomerLink,
  linkedReferenceId: string | undefined,
  hook: StoredSyncHook | undefined,
  hasSubscriptions: boolean,
): CustomerSyncState {
  if (linkedReferenceId !== link.referenceId) {
    return { customerId: link.customerId, status: "unverified", linked: false };
  }
  if (hook) {
    let status: CustomerSyncState["status"] = "pending";
    if (hook.status === "completed") {
      status = "synced";
    } else if (hook.status === "failed") {
      status = "error";
    }
    return {
      customerId: link.customerId,
      status,
      linked: true,
      hookId: hook.id,
      error: hook.error ?? undefined,
    };
  }
  return {
    customerId: link.customerId,
    status: hasSubscriptions ? "synced" : "unverified",
    linked: true,
  };
}
