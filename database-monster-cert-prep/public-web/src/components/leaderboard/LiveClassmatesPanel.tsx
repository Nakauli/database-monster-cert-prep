import { Activity } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { formatPresenceFreshness, type PublicPresenceRow } from "@/lib/presence";

export function LiveClassmatesPanel({ rows }: { rows: PublicPresenceRow[] }) {
  return (
    <aside className="live-classmates-panel" aria-label="Live classmates">
      <div className="live-classmates-heading">
        <Badge variant="secondary" className="w-fit">Live</Badge>
        <h2><Activity className="size-5" aria-hidden="true" /> Live classmates</h2>
        <p>Opt-in status only. Exact topics, scores, and answers stay private.</p>
      </div>

      {rows.length ? (
        <div className="live-classmates-list">
          {rows.map((row) => (
            <div className="live-classmate-row" key={row.user_id}>
              <span className="presence-dot" aria-hidden="true" />
              <UserAvatar name={row.display_name} src={row.avatar_url} size="sm" />
              <span className="live-classmate-main">
                <strong>{row.display_name}</strong>
                <small>{row.status} / {formatPresenceFreshness(row.last_seen_at)}</small>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="live-classmates-empty">
          <strong>No classmates online right now.</strong>
          <span>Turn on live status in your profile when you want to appear here.</span>
        </div>
      )}
    </aside>
  );
}
