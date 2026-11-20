"use client";

import { LuMoon, LuSun } from "react-icons/lu";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sppg-theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={dark ? "Tema terang" : "Tema gelap"}
      className={`inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${className}`}
    >
      {dark ? <LuSun className="size-5" /> : <LuMoon className="size-5" />}
    </button>
  );
}
