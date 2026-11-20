import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "brand" | "blue" | "amber" | "violet" | "rose";

const accents: Record<Accent, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  rose: "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "brand",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  accent?: Accent;
  className?: string;
}) {
  return (
    <div className={cn("surface p-5 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
        {icon && (
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accents[accent])}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
