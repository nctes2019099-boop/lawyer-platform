import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = "ar-EG"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateFull(date: Date | string, locale = "ar-EG"): string {
  return new Date(date).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: Date | string, locale = "ar-EG"): string {
  return new Date(date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatIQD(amount: number): string {
  return `${Math.abs(amount).toLocaleString("ar-IQ")} د.ع`;
}

export function getRelativeTime(date: Date | string, locale = "ar"): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (locale === "ar") {
    if (diffSec < 60) return "الآن";
    if (diffMin < 60) return `منذ ${diffMin} دقيقة${diffMin > 1 ? "" : ""}`;
    if (diffHour < 24) return `منذ ${diffHour} ساعة${diffHour > 1 ? "" : ""}`;
    if (diffDay === 1) return "أمس";
    if (diffDay < 7) return `منذ ${diffDay} أيام`;
    if (diffDay < 30) return `منذ ${Math.floor(diffDay / 7)} أسابيع`;
    return formatDate(date);
  }

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "yesterday";
  return `${diffDay}d ago`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}
