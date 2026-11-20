import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Memuat data...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400",
        className,
      )}
    >
      <span className="size-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label}
    </div>
  );
}
