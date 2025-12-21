const DEFAULT_LOCALE = "en-US";

const DISPLAY_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
};

const DISPLAY_DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function formatRelativeTime(date: string | Date, locale: string = DEFAULT_LOCALE): string {
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
  return formatDate(dateObj, locale);
}

export function formatDate(date: string | Date, locale: string = DEFAULT_LOCALE) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, DISPLAY_DATE_FORMAT);
}

export function formatDateTime(date: string | Date, locale: string = DEFAULT_LOCALE) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, DISPLAY_DATE_TIME_FORMAT);
}
