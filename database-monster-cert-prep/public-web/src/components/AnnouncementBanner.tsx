"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ANNOUNCEMENT_STORAGE_KEY,
  CURRENT_ANNOUNCEMENT_VERSION,
  shouldShowAnnouncement,
} from "@/lib/announcements";

function subscribe() {
  // Dismissal only changes through this component's own click handler, so there
  // is no external store to subscribe to.
  return () => {};
}

function readDismissedVersion(): string | null {
  try {
    return window.localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Dismissible "what's new" banner on the home page.
 *
 * The server snapshot pretends the current version was already dismissed, so the
 * banner is absent from the SSR HTML and there is no hydration mismatch. After
 * hydration the client snapshot reads localStorage and reveals the banner when
 * the stored version does not match the current announcement.
 */
export function AnnouncementBanner() {
  const dismissedVersion = useSyncExternalStore(
    subscribe,
    readDismissedVersion,
    () => CURRENT_ANNOUNCEMENT_VERSION,
  );
  const [closed, setClosed] = useState(false);

  function dismiss() {
    try {
      window.localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, CURRENT_ANNOUNCEMENT_VERSION);
    } catch {
      // Ignore write failures; the banner still closes for this session.
    }
    setClosed(true);
  }

  if (closed || !shouldShowAnnouncement(dismissedVersion)) return null;

  return (
    <section className="app-container pt-6" aria-label="Announcement">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-2">
            <Badge variant="secondary" className="w-fit font-mono uppercase tracking-[0.08em]">What&apos;s new</Badge>
            <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-ink">Fresh exam topics &amp; questions</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              We rebuilt the question bank and Learn library around your exam topics — DDL, DML, DQL,
              normalization, joins, ERD &amp; keys, table relationships, stored procedures, and triggers —
              plus new SQL syntax questions.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="sm"><Link href="/learn">Browse topics</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/practice">Start practicing</Link></Button>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Dismiss announcement"
            onClick={dismiss}
            className="self-end sm:self-start"
          >
            ✕
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
