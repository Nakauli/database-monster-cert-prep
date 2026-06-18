# Database Monster Cert Prep

An original database certification training system with two complementary interfaces:

- `database-monster-cert-prep/public-web` — public Next.js + TypeScript site for classmates
- `database-monster-cert-prep/app` and `web` — local Python CLI and Flask dashboard

This is an **unofficial Certiport-style practice tool**. It does not copy Certiport branding, proprietary interfaces, real exam questions, leaked content, or exam dumps.

## Public web app

```bash
cd database-monster-cert-prep/public-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The public app is fully static, deployable on Vercel's free Hobby plan, requires no login, and stores every user's progress only in that user's browser.

### Deploy

```bash
cd database-monster-cert-prep/public-web
vercel login
vercel
vercel --prod
```

For a GitHub-connected deployment, set Vercel's root directory to:

```text
database-monster-cert-prep/public-web
```

See the [public web README](database-monster-cert-prep/public-web/README.md) and [security notes](database-monster-cert-prep/public-web/SECURITY.md).

## Local Python system

```bash
cd database-monster-cert-prep
python -m pip install -r requirements.txt
python -m app.main exam-file diagnostic_exam
python web/app.py
```

The Python system includes the SQLite database, SQL lab runner, CLI exam engine, 360-question bank, study notes, and automated tests.

## Readiness target

Take the diagnostic without notes. Repair the weakest topics using the matching note and SQL lab. Before the real exam, target at least 85% on two different 50-minute simulations and at least 80% in every topic.

