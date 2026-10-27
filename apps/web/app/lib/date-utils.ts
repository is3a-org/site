export function formatRelativeTime(date: string | Date, locale = "en-US"): string {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: Date input is an established string-or-Date contract; only string timestamps require construction.
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

  // If less than 24 hours, show relative time
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes === 0 ? "Just now" : `${diffInMinutes}m ago`;
    }
    return `${Math.floor(diffInHours)}h ago`;
  }

  // Otherwise show full date
  return dateObj.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// UTC keeps server-rendered dates identical to the hydrated client's.
const calendarDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A calendar date such as "1 Jan 2027". */
export function formatCalendarDate(date: Date): string {
  return calendarDateFormat.format(date);
}
