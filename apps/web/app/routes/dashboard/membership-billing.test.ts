import { describe, expect, it } from "vite-plus/test";

import { formatMembershipCancellationDate, formatMembershipDate } from "./membership-billing";

describe("Membership billing dates", () => {
  it("uses the period end for cancellation at the end of the billing period", () => {
    const periodEnd = new Date(2026, 9, 25, 12);

    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Stripe represents an absent cancel-at date as null when cancellation is at period end.
    expect(formatMembershipCancellationDate(null, periodEnd)).toBe("October 25, 2026");
  });

  it("prefers a scheduled cancel-at date over the billing period end", () => {
    const cancelAt = new Date(2026, 8, 25, 12);
    const periodEnd = new Date(2026, 9, 25, 12);

    expect(formatMembershipCancellationDate(cancelAt, periodEnd)).toBe("September 25, 2026");
  });

  it("shows the billing-period fallback when Stripe has no usable dates", () => {
    expect(formatMembershipCancellationDate()).toBe("the end of your billing period");
    expect(formatMembershipDate("invalid date")).toBeUndefined();
    expect(formatMembershipDate()).toBeUndefined();
  });
});
