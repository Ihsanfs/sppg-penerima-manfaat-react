"use client";

import { LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizes: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup dialog"
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900",
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <LuX className="size-5" />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
