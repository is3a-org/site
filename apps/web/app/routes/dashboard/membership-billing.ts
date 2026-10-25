const DISPLAY_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
};

/** Formats a membership billing date, omitting absent or invalid display dates. */
export function formatMembershipDate(date?: string | number | Date | null): string | undefined {
  if (date === undefined || date === null || date === "" || date === 0) {
    return undefined;
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }
  return parsedDate.toLocaleDateString("en-US", DISPLAY_DATE_FORMAT);
}

/** Uses the billing period end when Stripe schedules cancellation without a cancel-at date. */
export function formatMembershipCancellationDate(
  cancelDate?: Date | null,
  renewalDate?: Date,
): string {
  return (
    formatMembershipDate(cancelDate) ??
    formatMembershipDate(renewalDate) ??
    "the end of your billing period"
  );
}
