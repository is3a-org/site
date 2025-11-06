export const MEMBERSHIPS = getMemberships();

function getMemberships() {
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

export function getMembershipByPriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }
  return Object.values(MEMBERSHIPS).find((m) => m.priceId === priceId);
}
