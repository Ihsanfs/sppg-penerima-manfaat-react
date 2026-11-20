import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "soft";
export type ButtonSize = "sm" | "md" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:scale-[.98]",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[.98]",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  icon: "size-9",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
