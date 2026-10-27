import { z } from "zod";

import type { CustomerSyncState, ImportCustomer, ImportUser } from "./bulk-import";

interface MatchResult {
  readonly matchedUser: ImportUser | null;
  readonly matchType: "stripeCustomerId" | "email" | "none";
  readonly hasConflict: boolean;
  readonly conflictReason?: string;
}

/** Stripe IDs take precedence over email: members may use a different login address. */
export function matchStripeCustomerToUser(
  customer: ImportCustomer,
  existingUsers: readonly ImportUser[],
): MatchResult {
  const userByStripeId = existingUsers.find((user) => user.stripeCustomerId === customer.id);
  if (userByStripeId) {
    return { matchedUser: userByStripeId, matchType: "stripeCustomerId", hasConflict: false };
  }
  const email = (customer.email ?? "").trim().toLowerCase();
  const userByEmail = email
    ? existingUsers.find((user) => user.email.trim().toLowerCase() === email)
    : undefined;
  if (userByEmail) {
    const hasConflict =
      userByEmail.stripeCustomerId !== null &&
      userByEmail.stripeCustomerId !== "" &&
      userByEmail.stripeCustomerId !== customer.id;
    return {
      matchedUser: userByEmail,
      matchType: "email",
      hasConflict,
      conflictReason: hasConflict
        ? `Account already linked to Stripe customer ${userByEmail.stripeCustomerId}`
        : undefined,
    };
  }
  return {
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: An unmatched customer has no account in the import plan.
    matchedUser: null,
    matchType: "none",
    hasConflict: false,
  };
}

export interface StripeCustomerValidation {
  readonly valid: boolean;
  readonly error?: string;
}

export function validateStripeCustomer(customer: ImportCustomer): StripeCustomerValidation {
  if (!customer.id) {
    return { valid: false, error: "Customer missing ID" };
  }
  if (!z.email().safeParse(customer.email?.trim()).success) {
    return { valid: false, error: "A valid email is required to create an account" };
  }
  return { valid: true };
}

export interface ImportPlan extends MatchResult {
  readonly customer: ImportCustomer;
  readonly action: "create" | "link" | "pending" | "synced" | "retry" | "conflict" | "invalid";
  readonly description: string;
}

export function planCustomerImport(
  customer: ImportCustomer,
  existingUsers: readonly ImportUser[],
  syncStates: readonly CustomerSyncState[],
): ImportPlan {
  const match = matchStripeCustomerToUser(customer, existingUsers);
  const base = { ...match, customer };
  if (match.hasConflict) {
    return { ...base, action: "conflict", description: match.conflictReason ?? "Conflicting link" };
  }
  if (match.matchedUser?.stripeCustomerId === customer.id) {
    const sync = syncStates.find((state) => state.customerId === customer.id);
    if (sync?.status === "synced") {
      return { ...base, action: "synced", description: "Account linked · subscriptions synced" };
    }
    if (sync?.status === "pending") {
      return { ...base, action: "pending", description: "Account linked · sync pending" };
    }
    return {
      ...base,
      action: "retry",
      description: sync?.error ?? "Account linked · subscription sync needs verification",
    };
  }
  if (match.matchedUser) {
    return {
      ...base,
      action: "link",
      description: `Link existing account ${match.matchedUser.email}`,
    };
  }
  const validation = validateStripeCustomer(customer);
  return validation.valid
    ? { ...base, action: "create", description: "Create account, link and queue subscription sync" }
    : { ...base, action: "invalid", description: validation.error ?? "Invalid customer" };
}

export function canImportPlan(plan: ImportPlan): boolean {
  return !["conflict", "invalid", "synced"].includes(plan.action);
}
