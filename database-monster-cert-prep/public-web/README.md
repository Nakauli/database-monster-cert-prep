# Database Monster Public Web App

A polished, static, unofficial Certiport-style database fundamentals practice simulator. It is original practice content—not an official Certiport product, exam interface, logo, or question bank.

## Features

- Diagnostic, 50-minute timed, Final Boss, and Panic Review modes
- Topic and difficulty practice without a timer
- 360 original questions with randomized question and choice order
- SQL code blocks, schemas, sample tables, and output grids
- Single-answer and multiple-answer questions
- Mark-for-review, unanswered warnings, review screen, and timer
- Scores, topic breakdown, strongest/weakest topics, and recommendations
- Browser-only mistake notebook and progress history
- 48-hour, 7-day, and 14-day study roadmaps
- Eight guided SQL labs with answer reveal
- Light/dark themes, keyboard focus states, and responsive layouts
- Fully static architecture with no accounts, API, or writable database

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production verification:

```bash
npm run test:data
npm run lint
npm run typecheck
npm run build
```

The output is exported to `out/`.

## Deploy to Vercel

### Vercel CLI

From this directory:

```bash
npm install
vercel login
vercel
vercel --prod
```

Accept the detected Next.js settings. No environment variables are required.

### Vercel dashboard

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `database-monster-cert-prep/public-web`.
3. Keep the detected Next.js build command.
4. Deploy.

The app uses static export and can also be hosted by any service that serves the `out/` directory.

## How classmates use it

Share the deployment URL. They do not need an account. Every classmate gets an independent browser-local progress history; nothing is synchronized between devices.

## Progress and reset behavior

Attempts, last result, theme preference, and mistakes are stored in `localStorage`. Use **Mistakes → Reset all progress** or clear the site's browser data to reset.

## Add or update questions

The generated public bank is `src/data/questions.json`. Its supported fields include:

- `scenario`
- `schema`
- `sampleData`
- `code` and `codeLabel`
- `outputTable`
- `choices`
- `correctAnswers`
- `explanation`
- `wrongAnswerExplanations`
- `reviewFile`

The source Python bank can be remigrated with:

```bash
node tools/migrate-questions.mjs
npm run test:data
```

Never add leaked questions, exam dumps, protected branding, or real student information.

## Security

No secrets or environment variables are needed. The app has no server-side data collection. React renders content as text, and the site does not execute SQL. See [SECURITY.md](SECURITY.md) for headers, dependency notes, and privacy details.

## Recommended study sequence

1. Take the diagnostic without notes.
2. Open the mistake notebook.
3. Study the lowest topic and complete its SQL lab.
4. Run a focused topic practice set.
5. Target 85% or higher on two different timed exams, with every topic at 80% or higher.

