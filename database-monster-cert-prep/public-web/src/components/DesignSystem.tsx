import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  label,
  title,
  description,
  actions,
  className,
}: {
  label?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-5", className)}>
      {label && (
        <Badge variant="secondary" className="w-fit font-mono uppercase tracking-[0.08em]">
          {label}
        </Badge>
      )}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-4xl flex-col gap-4">
          <h1 className="font-heading page-title">{title}</h1>
          {description && <p className="page-copy">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{title}</h2>
        {description && <p className="text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatGrid({
  stats,
  columns = 4,
  className,
}: {
  stats: Array<{ label: string; value: string | number; detail?: string }>;
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-2xl border bg-card shadow-[0_18px_60px_rgb(23_37_44_/_0.07)]",
        columns === 3 ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((stat) => (
        <article className="border-b p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0" key={stat.label}>
          <strong className="font-heading block text-3xl font-semibold tracking-[-0.04em] text-ink">{stat.value}</strong>
          <span className="mt-1 block text-sm font-medium text-muted-foreground">{stat.label}</span>
          {stat.detail && <span className="mt-2 block text-xs text-muted-foreground">{stat.detail}</span>}
        </article>
      ))}
    </div>
  );
}

export function InfoCard({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-[0_16px_50px_rgb(23_37_44_/_0.06)]", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      {action && <div className="px-4 pb-4">{action}</div>}
    </Card>
  );
}

export function EmptyPanel({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="min-h-72 justify-center border-dashed bg-card/70">
      <CardHeader className="max-w-xl">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {href && actionLabel && (
        <CardContent>
          <Button asChild>
            <Link href={href}>{actionLabel}</Link>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export function LoadingPanel({ label = "Preparing your workspace" }: { label?: string }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-24 w-full" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
