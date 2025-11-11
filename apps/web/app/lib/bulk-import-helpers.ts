type User = {
  id: string;
  email: string;
  stripeCustomerId: string | null;
};

type StripeCustomer = {
  id: string;
  email: string | null;
  name?: string | null;
  created: number;
};

type MatchResult = {
  matchedUser: User | null;
  matchType: "stripeCustomerId" | "email" | "none";
  hasConflict: boolean;
  conflictReason?: string;
  alreadySynced: boolean;
};

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
  existingUsers: User[],
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
  if (customer.email) {
    const normalizedCustomerEmail = customer.email.toLowerCase();
    const userByEmail = existingUsers.find(
      (u) => u.email.toLowerCase() === normalizedCustomerEmail,
    );
    if (userByEmail) {
      // Check if this user already has a different Stripe customer ID
      if (userByEmail.stripeCustomerId && userByEmail.stripeCustomerId !== customer.id) {
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
    matchedUser: null,
    matchType: "none",
    hasConflict: false,
    alreadySynced: false,
  };
}

/**
 * Validates that a Stripe customer has the minimum required data for import
 */
export function validateStripeCustomer(customer: StripeCustomer): {
  valid: boolean;
  error?: string;
} {
  if (!customer.id) {
    return { valid: false, error: "Customer missing ID" };
  }

  // For auto-creating users, we need an email
  if (!customer.email) {
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
