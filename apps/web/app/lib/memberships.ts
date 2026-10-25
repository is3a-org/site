/** A membership plan uses the Stripe price configured for this deployment. */
export interface MembershipPlan {
  id: string;
  name: string;
  priceId: string;
  price: string;
}

/** Membership plans offered by the application. */
export interface MembershipCatalog {
  FULL: MembershipPlan;
  FLEX: MembershipPlan;
}

// Mapped catalog keys let Object.values retain the membership plan type.
export const MEMBERSHIPS: Pick<MembershipCatalog, keyof MembershipCatalog> = getMemberships();

function getMemberships(): MembershipCatalog {
  const fullPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_FULL;
  const flexPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_FLEX;

  if (!fullPriceId || !flexPriceId) {
    throw new Error(
      "Missing VITE_STRIPE_PRICE_ID_FULL or VITE_STRIPE_PRICE_ID_FLEX environment variables",
    );
  }

  return {
    FULL: {
      id: "FULL",
      name: "Full",
      priceId: fullPriceId,
      price: "50 EUR",
    },
    FLEX: {
      id: "FLEX",
      name: "Flex",
      priceId: flexPriceId,
      price: "25 EUR",
    },
  };
}

/** Finds a membership plan by Stripe price ID; missing input returns null. */
export function getMembershipByPriceId(
  priceId: string | null | undefined,
): MembershipPlan | null | undefined {
  if (!priceId) {
    return null;
  }
  return Object.values(MEMBERSHIPS).find((m) => m.priceId === priceId);
}
