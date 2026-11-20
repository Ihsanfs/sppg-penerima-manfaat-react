"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { api } from "@/lib/client";
import { isAdmin } from "@/lib/permissions";
import type { AuthUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  LuBookOpen,
  LuBuilding2,
  LuChartColumn,
  LuChartNoAxesCombined,
  LuChevronDown,
  LuClipboardList,
  LuDownload,
  LuExternalLink,
  LuHistory,
  LuLayoutDashboard,
  LuLogOut,
  LuMapPinned,
  LuMenu,
  LuSettings,
  LuShieldCheck,
  LuTags,
  LuUsers,
  LuX,
} from "react-icons/lu";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LuLayoutDashboard;
  badgeKey?: string;
  adminOnly?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Operasional",
    items: [
      { href: "/admin", label: "Ringkasan", icon: LuLayoutDashboard },
      { href: "/admin/beneficiaries", label: "Penerima Manfaat", icon: LuUsers, badgeKey: "aktif" },
      { href: "/admin/institutions", label: "Lembaga", icon: LuBuilding2, badgeKey: "lembaga" },
      { href: "/admin/categories", label: "Kategori", icon: LuTags, badgeKey: "kategori" },
      { href: "/admin/reports", label: "Laporan Harian", icon: LuClipboardList, badgeKey: "laporan" },
      { href: "/admin/operational", label: "Operasional LIVE / ARSIP", icon: LuChartNoAxesCombined },
    ],
  },
  {
    label: "Laporan & GIS",
    items: [
      { href: "/admin/weekly-report", label: "Laporan Mingguan", icon: LuChartColumn },
      { href: "/admin/gis", label: "GIS Lembaga", icon: LuMapPinned },
      { href: "/admin/history", label: "Riwayat Penerima", icon: LuHistory },
      { href: "/admin/audit", label: "Audit Log", icon: LuShieldCheck },
    ],
  },
  {
    label: "Data & Pengaturan",
    items: [
      { href: "/admin/impor-ekspor", label: "Impor / Ekspor", icon: LuDownload },
      { href: "/admin/manual-book", label: "Manual Book", icon: LuBookOpen },
      { href: "/admin/profile", label: "Profil SPPG", icon: LuSettings, adminOnly: true },
      { href: "/admin/users", label: "Pengguna", icon: LuUsers, adminOnly: true },
    ],
  },
];

export function AdminShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [badges, setBadges] = useState<Record<string, string>>({});

  const admin = isAdmin(user);

  useEffect(() => {
    let active = true;
    api.dashboard()
      .then((data) => {
        if (active) {
          setBadges({
            aktif: String(data.counts.aktif),
            lembaga: String(data.counts.lembaga),
            kategori: String(data.counts.kategori),
            laporan: String(data.counts.laporan),
          });
        }
      })
      .catch(() => {
        // Badge tidak boleh mengganggu navigasi.
      });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-lg font-black text-white shadow-lg shadow-brand-600/25">
          S
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">SPPG Samarang</p>
          <p className="truncate text-[11px] text-slate-400">Penerima Manfaat MBG</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {groups.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || admin);
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {group.label}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                          : "text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300",
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {badge && (
                        <span
                          className={cn(
                            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div>
          <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Publik
          </p>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LuExternalLink className="size-[18px]" />
            <span>Dashboard Publik</span>
          </Link>
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 p-4 dark:from-brand-500/10 dark:to-emerald-500/5">
          <LuChartNoAxesCombined className="size-5 text-brand-600 dark:text-brand-400" />
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Login sebagai <span className="font-semibold">{admin ? "admin" : "petugas"}</span>. Data
            identitas hanya tersedia di area administrasi.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 dark:border-slate-800 lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(18rem,calc(100vw-3.5rem))] shadow-2xl">
            {sidebar}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute top-4 right-3 rounded-lg bg-white/95 p-2 text-slate-600 shadow-md ring-1 ring-slate-200 backdrop-blur dark:bg-slate-800/95 dark:text-white dark:ring-slate-700"
            >
              <LuX className="size-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden"
            >
              <LuMenu className="size-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400">Area Administrasi</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Sistem Penerima Manfaat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pr-2 pl-1.5 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden text-start sm:block">
                  <span className="block max-w-36 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {user.name}
                  </span>
                  <span className="block max-w-36 truncate text-[10px] text-slate-400">
                    {admin ? "Administrator" : "Petugas"}
                  </span>
                </span>
                <LuChevronDown className="size-4 text-slate-400" />
              </button>

              {userOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup menu pengguna"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setUserOpen(false)}
                  />
                  <div className="absolute top-full right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="px-3 py-2 sm:hidden">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">{user.name}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                      <p className="mt-1 text-[10px] font-semibold text-brand-600 uppercase">
                        {admin ? "Administrator" : "Petugas"}
                      </p>
                    </div>
                    <Link
                      href="/"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <LuExternalLink className="size-4" /> Dashboard Publik
                    </Link>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LuLogOut className="size-4" /> {loggingOut ? "Keluar..." : "Keluar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-7">{children}</main>
      </div>
    </div>
  );
}
