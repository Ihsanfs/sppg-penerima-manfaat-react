import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function FormField({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="field-label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("field cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field h-auto min-h-28 py-3", className)} {...props} />;
}

export function CheckboxField({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/50">
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded border-slate-300 accent-brand-600"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-400">{description}</span>}
      </span>
    </label>
  );
}
