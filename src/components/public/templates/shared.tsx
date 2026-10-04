import type { MapPin } from "lucide-react";

export function formatDate(date: string | null) {
  if (!date) return null;
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  } catch {
    return date;
  }
}

export function formatTime(time: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "م" : "ص";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m ?? "00"} ${suffix}`;
}

export type IconType = typeof MapPin;
