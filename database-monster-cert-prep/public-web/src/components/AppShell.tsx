"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database } from "lucide-react";
import type { ReactNode } from "react";
import { AuthNav } from "@/components/auth/AuthNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { primaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {primaryNavigation.map((item) => {
        const active = item.activePaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(path)));
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
            <span className="relative grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_34px_rgb(32_122_101_/_0.22)] ring-1 ring-primary/15 transition-transform group-hover:-translate-y-0.5">
              <Database className="size-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 rounded-full border-2 border-background bg-warning px-1.5 py-0.5 font-mono text-[0.55rem] font-bold leading-none text-warning-foreground">
                SQL
              </span>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-base font-semibold tracking-[-0.03em] text-ink">Database Monster</span>
              <span className="text-xs font-medium text-muted-foreground">Exam prep simulator</span>
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
