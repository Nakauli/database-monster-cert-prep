# Security and privacy

This application is intentionally static and account-free.

## Data handling

- No names, email addresses, student IDs, passwords, or analytics identifiers are collected.
- Exam attempts and mistakes are stored only in the visitor's browser using `localStorage`.
- There is no public writable database, server action, API route, login, or upload endpoint.
- Question and lab content uses fictional sample data.
- Resetting browser site data or using the in-app **Reset all progress** action removes saved progress.

## Rendering safety

All question content is bundled JSON controlled by the repository. React renders values as text. The application does not use `dangerouslySetInnerHTML`, evaluate SQL, or execute user-provided code.

## Deployment protections

`vercel.json` applies a restrictive Content Security Policy, clickjacking protection, MIME sniffing protection, a restricted permissions policy, and a conservative referrer policy.

## Dependency checks

Run:

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run audit
```

The current stable Next.js package may report a moderate inherited PostCSS advisory in its bundled dependency. This site uses a static export and does not process visitor-supplied CSS. Monitor the advisory and update Next.js when a stable fixed release is available; do not force the audit's suggested downgrade to an obsolete Next.js version.

## Reporting a problem

Open a GitHub issue without including private student information, credentials, tokens, or real exam content.

