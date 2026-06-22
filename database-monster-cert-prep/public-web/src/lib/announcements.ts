/**
 * Site-wide "what's new" announcement shown as a dismissible banner on the home
 * page. Dismissal is stored per browser in localStorage as a version string.
 * Bumping `CURRENT_ANNOUNCEMENT_VERSION` re-shows the banner to everyone, so a
 * future announcement only needs a new version + new copy.
 */
export const ANNOUNCEMENT_STORAGE_KEY = "dm:announcement-dismissed";

export const CURRENT_ANNOUNCEMENT_VERSION = "2026-06-whiteboard";

/**
 * The banner shows whenever the version the user last dismissed does not match
 * the current announcement version (including when nothing has been dismissed).
 */
export function shouldShowAnnouncement(
  dismissedVersion: string | null | undefined,
  currentVersion: string = CURRENT_ANNOUNCEMENT_VERSION,
): boolean {
  return dismissedVersion !== currentVersion;
}
