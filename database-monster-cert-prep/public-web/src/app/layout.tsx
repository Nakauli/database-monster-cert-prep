import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: {
    default: "Database Monster - Certification Practice",
    template: "%s - Database Monster",
  },
  description: "An unofficial, original Certiport-style database fundamentals practice simulator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, geistMono.variable)}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
