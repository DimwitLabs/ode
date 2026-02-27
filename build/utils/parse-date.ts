export function parseDateToRSSString(dateStr: string | undefined, fallback: Date): string {
  if (!dateStr) {
    return fallback.toUTCString();
  }

  const timeMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})[\sT](\d{2}):(\d{2})(?::(\d{2}))?/);

  if (timeMatch) {
    const [, datePart, hours, minutes, seconds = '00'] = timeMatch;
    const localDate = new Date(`${datePart}T${hours}:${minutes}:${seconds}`);
    return localDate.toUTCString();
  }

  const dateOnly = new Date(dateStr);
  const now = new Date();
  dateOnly.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
  return dateOnly.toUTCString();
}
