import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Database Monster — Certification Practice",
    template: "%s · Database Monster",
  },
  description: "An unofficial, original Certiport-style database fundamentals practice simulator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
