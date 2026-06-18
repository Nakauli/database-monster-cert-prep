"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthNav } from "@/components/auth/AuthNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/labs", label: "SQL Labs" },
  { href: "/about", label: "About" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navigation.map((item) => {
        const active = pathname === item.href;
        return (
          <Button
            asChild
            className={cn("justify-start", active && "bg-secondary text-secondary-foreground")}
            key={item.href}
            size="sm"
            variant={active ? "secondary" : "ghost"}
          >
            <Link href={item.href} onClick={onNavigate}>
              {item.label}
            </Link>
          </Button>
        );
      })}
      <AuthNav closeMenu={onNavigate ?? (() => undefined)} />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
        <div className="app-container flex h-16 items-center justify-between gap-4">
          <Link className="group flex items-center gap-3 text-decoration-none" href="/" aria-label="Database Monster home">
            <span className="grid size-10 place-items-center rounded-xl bg-primary font-mono text-sm font-bold text-primary-foreground shadow-[0_12px_30px_rgb(32_122_101_/_0.24)] transition-transform group-hover:-translate-y-0.5">
              DB
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-semibold tracking-[-0.02em] text-ink">Database Monster</span>
              <span className="text-xs text-muted-foreground">Certification practice</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <NavLinks />
          </nav>

          <Sheet>
            <SheetTrigger asChild>
              <Button className="lg:hidden" size="sm" variant="outline">
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Database Monster</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2" aria-label="Mobile navigation">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card/75">
        <div className="app-container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Unofficial database certification practice. Original questions only.</p>
          <p>Authenticated progress is private per user.</p>
        </div>
      </footer>
    </div>
  );
}
