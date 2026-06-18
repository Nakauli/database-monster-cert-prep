"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthNav } from "@/components/auth/AuthNav";
import { getTheme, setTheme as persistTheme } from "@/lib/storage";

const navigation = [
  { href: "/roadmap", label: "Roadmap" },
  { href: "/labs", label: "SQL Labs" },
  { href: "/about", label: "About" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const initial = getTheme();
      setTheme(initial);
      persistTheme(initial);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    persistTheme(next);
  }

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <Link className="brand-mark" href="/" aria-label="Database Monster home">
            <span aria-hidden="true">DB</span>
            <span>
              Database Monster
              <small>Train hard. Query smart. Pass ready.</small>
            </span>
          </Link>
          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <AuthNav closeMenu={() => setMenuOpen(false)} />
          </nav>
          <div className="flex items-center gap-2">
            <button className="icon-button" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
              <span aria-hidden="true">{theme === "light" ? "◐" : "☀"}</span>
            </button>
            <button
              className="icon-button menu-button"
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <span aria-hidden="true">☰</span>
            </button>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="page-shell flex flex-col justify-between gap-3 py-8 text-sm sm:flex-row">
          <p>Unofficial Certiport-style database fundamentals practice. No exam dumps.</p>
          <p>Train hard. Query smart. Pass ready.</p>
        </div>
      </footer>
    </div>
  );
}
