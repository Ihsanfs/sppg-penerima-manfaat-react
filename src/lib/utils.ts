import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clean(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return value.trim() || null;
  return String(value);
}

export function numOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function todayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function hariIndo(): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  }).format(new Date());
}

export function formatTanggal(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWaktu(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function parseKategori(
  value: unknown,
): Record<string, number> {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, number>;
    } catch {
      return {};
    }
  }
  if (value && typeof value === "object") return value as Record<string, number>;
  return {};
}
