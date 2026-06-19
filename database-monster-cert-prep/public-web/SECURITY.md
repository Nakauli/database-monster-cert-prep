# Security and privacy

This application uses Supabase Auth and Postgres for private, per-user progress.

## Data handling

- Supabase Auth stores account email and password credentials. Passwords never pass through custom storage.
- Optional display name, school, and course fields are stored in the protected `profiles` table.
- Exam attempts, question results, topic mastery, and mistakes are stored in Supabase Postgres.
- `localStorage` is limited to theme, last selected mode, and temporary unfinished exam state.
- Question and lab content uses fictional sample data.
- Deleting an Auth user cascades through their progress rows.

## Rendering safety

All question content is bundled JSON controlled by the repository. React renders values as text and does not use `dangerouslySetInnerHTML`. SQL lab queries run only inside the bundled in-browser SQLite WebAssembly sandbox against fictional seeded data; they are not sent to Supabase or a server.

## Authorization

- All five user tables have RLS enabled.
- Anonymous/public table privileges are revoked.
- Ownership policies compare `auth.uid()` with `user_id`, or with `profiles.id`.
- The atomic save function derives its user ID from `auth.uid()` and never accepts a caller-supplied user ID.
- The frontend uses only the anon/publishable key. Never configure a service-role key in `NEXT_PUBLIC_*`.

## Deployment protections

`vercel.json` applies a restrictive Content Security Policy, permits authenticated API/WebSocket connections only to Supabase, blocks clickjacking and MIME sniffing, restricts browser permissions, and applies a conservative referrer policy. The `wasm-unsafe-eval` script policy permits WebAssembly compilation for the bundled SQLite engine without enabling JavaScript `eval`.

## Dependency checks

Run:

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run audit
```

The current stable Next.js package may report a moderate inherited PostCSS advisory in its bundled dependency. The application does not process visitor-supplied CSS. Monitor the advisory and update Next.js when a stable fixed release is available; do not force the audit's suggested downgrade to an obsolete Next.js version.

## Reporting a problem

Open a GitHub issue without including private student information, credentials, tokens, or real exam content.
