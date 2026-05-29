export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((d - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("pl", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), "month");
  return rtf.format(Math.round(diff / 31536000), "year");
}
