import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SPPG Samarang — Penerima Manfaat",
    template: "%s | SPPG Samarang",
  },
  description:
    "Sistem informasi penerima manfaat SPPG Samarang: dashboard publik agregat, pengelolaan penerima, lembaga, kategori, laporan harian, dan GIS.",
};

const themeScript = `
  try {
    var saved = localStorage.getItem('sppg-theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
