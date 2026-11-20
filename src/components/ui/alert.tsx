"use client";

import { LuCircleAlert, LuCircleCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";

export function Alert({
  message,
  variant = "error",
  onClose,
  className,
}: {
  message: string | null | undefined;
  variant?: "error" | "success";
  onClose?: () => void;
  className?: string;
}) {
  if (!message) return null;
  const success = variant === "success";
  const Icon = success ? LuCircleCheck : LuCircleAlert;

  return (
    <div
      className={cn(
        "mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
        className,
      )}
      role={success ? "status" : "alert"}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold opacity-70 hover:opacity-100"
          aria-label="Tutup notifikasi"
        >
          ×
        </button>
      )}
    </div>
  );
}
