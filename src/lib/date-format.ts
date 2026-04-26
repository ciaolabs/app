const MEDIUM_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Europe/Rome",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Europe/Rome",
});

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatMediumDateTime(timestamp: string) {
  const parts = MEDIUM_DATE_TIME_FORMATTER.formatToParts(new Date(timestamp));

  return `${partValue(parts, "month")} ${partValue(parts, "day")}, ${partValue(parts, "year")}, ${partValue(parts, "hour")}:${partValue(parts, "minute")} ${partValue(parts, "dayPeriod")}`;
}

export function formatTime(timestamp: string) {
  const parts = TIME_FORMATTER.formatToParts(new Date(timestamp));

  return `${partValue(parts, "hour")}:${partValue(parts, "minute")} ${partValue(parts, "dayPeriod")}`;
}

export function formatSubmittedAt(timestamp: string | null) {
  return timestamp ? formatMediumDateTime(timestamp) : "not yet submitted";
}
