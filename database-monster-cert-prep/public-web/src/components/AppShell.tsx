"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { House, Cards, Notebook, MapTrifold, Terminal, Sun, MoonStars, List } from "@phosphor-icons/react";
import { getTheme, setTheme as persistTheme } from "@/lib/storage";

const navigation = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/practice", label: "Topic Practice", icon: Cards },
  { href: "/mistakes", label: "Mistakes", icon: Notebook },
  { href: "/roadmap", label: "Roadmap", icon: MapTrifold },
  { href: "/labs", label: "SQL Labs", icon: Terminal },
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
              <small>Unofficial certification practice</small>
            </span>
          </Link>
          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? "active" : ""}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={16} weight={pathname === item.href ? "fill" : "regular"} style={{ verticalAlign: "-3px", marginRight: 6 }} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button className="icon-button" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
              {theme === "light" ? <MoonStars size={18} weight="bold" /> : <Sun size={18} weight="bold" />}
            </button>
            <button
              className="icon-button menu-button"
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <List size={18} weight="bold" />
            </button>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="page-shell flex flex-col justify-between gap-3 py-8 text-sm sm:flex-row">
          <p>Unofficial Certiport-style database fundamentals practice. No exam dumps.</p>
          <p>Progress stays in this browser.</p>
        </div>
      </footer>
    </div>
  );
}
