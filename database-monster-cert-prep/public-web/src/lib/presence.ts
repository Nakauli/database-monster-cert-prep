import { createClient } from "@/lib/supabase/server";
import {
  shapePublicPresenceRows,
  type PublicPresenceDatabaseRow,
  type PublicPresenceRow,
} from "@/lib/presence-shared";

export {
  formatPresenceFreshness,
  isAllowedPresenceStatus,
  mapPathToPresence,
  PRESENCE_STALE_AFTER_MS,
  PRESENCE_STATUSES,
  shapePublicPresenceRows,
  type PresenceRouteState,
  type PresenceStatus,
  type PublicPresenceRow,
} from "@/lib/presence-shared";

export async function getPublicPresence(limit = 12): Promise<PublicPresenceRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_public_presence", {
    p_limit: limit,
  });

  if (error) throw new Error(error.message);

  return shapePublicPresenceRows((data ?? []) as PublicPresenceDatabaseRow[]);
}
