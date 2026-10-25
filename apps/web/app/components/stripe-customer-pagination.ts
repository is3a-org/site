/** Tracks Stripe cursors, including the undefined cursor for the first page. */
export interface StripeCustomerPagination {
  readonly currentCursor?: string;
  readonly pageHistory: readonly (string | undefined)[];
}

/** Saves the current page before advancing to the next Stripe customer cursor. */
export function advanceStripeCustomerPage(
  pagination: StripeCustomerPagination,
  lastCustomerId: string,
): StripeCustomerPagination {
  return {
    currentCursor: lastCustomerId,
    pageHistory: [...pagination.pageHistory, pagination.currentCursor],
  };
}

/** Restores the previous Stripe cursor, including the first page. */
export function rewindStripeCustomerPage(
  pagination: StripeCustomerPagination,
): StripeCustomerPagination {
  if (pagination.pageHistory.length === 0) {
    return pagination;
  }

  return {
    currentCursor: pagination.pageHistory.at(-1),
    pageHistory: pagination.pageHistory.slice(0, -1),
  };
}
