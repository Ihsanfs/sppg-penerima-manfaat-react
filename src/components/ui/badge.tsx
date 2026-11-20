import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeColor = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const colors: Record<BadgeColor, string> = {
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
};

export function Badge({
  color = "neutral",
  children,
  className,
}: {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
