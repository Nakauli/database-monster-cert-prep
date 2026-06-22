"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { mapPathToPresence } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function PresenceHeartbeat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const presence = useMemo(() => mapPathToPresence(routeKey), [routeKey]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const client = supabase;

    let cancelled = false;

    async function sendHeartbeat() {
      if (cancelled || document.visibilityState === "hidden") return;

      try {
        const { data: userData, error: userError } = await client.auth.getUser();
        if (userError || !userData.user) return;

        const { data: profile, error: profileError } = await client
          .from("profiles")
          .select("presence_opt_in")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (profileError || !profile?.presence_opt_in) return;

        await client.rpc("upsert_user_presence", {
          p_status: presence.status,
          p_current_area: presence.currentArea,
        });
      } catch {
        // Presence is ambient; failures should never interrupt studying.
      }
    }

    void sendHeartbeat();
    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [presence.currentArea, presence.status]);

  return null;
}
