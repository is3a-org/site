export function formatRelativeTime(date: string | Date, locale: string = "en-US"): string {
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
