interface User {
  readonly id: string;
  readonly email: string;
  readonly stripeCustomerId: string | null;
}

interface StripeCustomer {
  readonly id: string;
  readonly email: string | null;
  readonly name?: string | null;
  readonly created: number;
}

interface MatchResult {
  readonly matchedUser: User | null;
  readonly matchType: "stripeCustomerId" | "email" | "none";
  readonly hasConflict: boolean;
  readonly conflictReason?: string;
  readonly alreadySynced: boolean;
}

/**
 * Attempts to match a Stripe customer to an existing user in the system.
 * Matching priority:
 * 1. By Stripe customer ID (exact match)
 * 2. By email address (case-insensitive)
 * 3. No match found
 *
 * Also detects conflicts where a user already has a different Stripe customer ID
 */
export function matchStripeCustomerToUser(
  customer: StripeCustomer,
  existingUsers: readonly User[],
): MatchResult {
  // First try to match by Stripe customer ID
  const userByStripeId = existingUsers.find((u) => u.stripeCustomerId === customer.id);
  if (userByStripeId) {
    return {
      matchedUser: userByStripeId,
      matchType: "stripeCustomerId",
      hasConflict: false,
      alreadySynced: true, // This customer is already linked to this user
    };
  }

  // Then try to match by email (case-insensitive)
  if (customer.email !== null && customer.email.length > 0) {
    const normalizedCustomerEmail = customer.email.toLowerCase();
    const userByEmail = existingUsers.find(
      (u) => u.email.toLowerCase() === normalizedCustomerEmail,
    );
    if (userByEmail) {
      // Check if this user already has a different Stripe customer ID
      if (
        userByEmail.stripeCustomerId !== null &&
        userByEmail.stripeCustomerId.length > 0 &&
        userByEmail.stripeCustomerId !== customer.id
      ) {
        return {
          matchedUser: userByEmail,
          matchType: "email",
          hasConflict: true,
          conflictReason: `User already linked to Stripe customer ${userByEmail.stripeCustomerId}`,
          alreadySynced: false,
        };
      }

      return {
        matchedUser: userByEmail,
        matchType: "email",
        hasConflict: false,
        alreadySynced: false,
      };
    }
  }

  // No match found
  return {
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: The customer matching contract returns null when no user is matched.
    matchedUser: null,
    matchType: "none",
    hasConflict: false,
    alreadySynced: false,
  };
}

/** A Stripe customer validation result describes whether automatic user creation is possible. */
export interface StripeCustomerValidation {
  readonly valid: boolean;
  readonly error?: string;
}

/** Validate the minimum Stripe customer data needed for automatic user creation. */
export function validateStripeCustomer(customer: StripeCustomer): StripeCustomerValidation {
  if (!customer.id) {
    return { valid: false, error: "Customer missing ID" };
  }

  // For auto-creating users, we need an email
  if (customer.email === null || customer.email.length === 0) {
    return {
      valid: false,
      error: "Customer missing email (required for auto-creating users)",
    };
  }

  // Basic email validation
  if (!customer.email.includes("@")) {
    return { valid: false, error: "Customer email is invalid" };
  }

  return { valid: true };
}
