# Permit Intake — Day 1

A Next.js application for staff-facing residential permit intake. This is a Day 1 foundation, not a production permit reviewer.

## Run now

Node 24 is required. From this directory:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. `/` and `/sample` work without credentials. The sample uses synthetic, hand-authored findings. Its decisions are in memory and its export is a text demonstration, not the final audited PDF workflow.

## Continue without Supabase

Open `/desk` for the browser-only manual review workflow. Enter a project name, add PDFs, inspect them side by side with the illustrative checklist, record decisions and page references, and export a UTF-8 text draft. No files are uploaded or persisted, and refreshing clears the session. Limits: five PDFs, 25 MB and 40 pages combined. Encrypted or damaged PDFs are rejected. Adding or removing documents resets review decisions.

This is a manual workflow. AI review, city-approved rules, accounts, storage and jobs remain pending. The existing CLI AI spike is separate.

## Enable real login and projects

1. Create a new development project at https://supabase.com/dashboard.
2. In SQL Editor run `supabase/migrations/202610280001_foundation.sql` once, before creating users. It enables RLS and creates a private PDF bucket. Each new auth user receives an isolated demo workspace.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project connection settings. Never put a service-role key into a NEXT_PUBLIC variable.
4. Under Auth email templates, configure the sign-in template to display `{{ .Token }}` so this app's email-code form works. Configure custom SMTP for external email delivery. Do not assume default SMTP can reach arbitrary addresses.
5. Restart the dev server. Visit `/login`, request a code, and verify with the same email. Create a project at `/workspace`.
6. Repeat with a second email in a separate browser profile. Each account should see only its own projects. Run the SQL isolation test described below before pilot data.

Membership management and invitations are intentionally not enabled. A fresh development database is assumed; users created before the migration need explicit workspace provisioning.

## AI / PDF spike

The CLI sends extracted text from a synthetic PDF to OpenAI and verifies its returned citations. It is not yet a background worker. Scans are marked unreadable; vision fallback is Day 3 work.

```sh
npm run fixtures
# Set OPENAI_API_KEY and OPENAI_MODEL in .env.local first.
npm run smoke:ai
npm run smoke:ai -- fixtures/synthetic-missing.pdf
```

Choose a structured-output-capable model available in your API account. The earlier plan's model identifier is not assumed to be a public API identifier. Results and usage go to ignored `artifacts/smoke-result.json`. No real packet should be used in this spike.

## Checks

```sh
npm run lint
npm test
npm run build
npm run typecheck
```

`supabase/tests/isolation.sql` is a rollback-only database test to run in Supabase SQL Editor on the development project after the migration. It seeds two temporary auth identities inside a transaction, checks cross-tenant reads/writes and tenant-consistent foreign keys, then rolls back. It has not run until you connect a database. Also verify private Storage requests with two authenticated browser sessions before enabling uploads.

## Deployment

Push this folder to a private GitHub repository and import it into Vercel with the Next.js preset and Node 24. Configure the two Supabase environment variables for the preview environment. Keep the OpenAI key out of browser variables; the CLI spike does not need it in Vercel yet. No deployment or GitHub remote has been created by this starter.

## Map

- `src/app`: dashboard, sample review, OTP login and live projects.
- `src/lib/contracts`: shared Zod API/review schemas.
- `src/lib/supabase` and `src/proxy.ts`: cookie auth and session refresh.
- `src/lib/documents`: bounded, page-preserving PDF extraction.
- `src/lib/ai`: evidence validation.
- `scripts`: synthetic PDFs and real model smoke test.
- `supabase`: database migration and isolation check.
- `.github/workflows/ci.yml`: lint, test, build and typecheck.

## Not implemented yet

Live uploads, durable jobs, city-approved checklist publishing, vision fallback, invitations, audit/export snapshots, analytics, and resubmissions. No real model call, live SMTP test, or deployed preview is claimed without corresponding service setup. Read `docs/day-1.md` for the handoff.

## Local watcher troubleshooting

If macOS reports `EMFILE` while running the dev server, stop it and run `WATCHPACK_POLLING=true npm run dev`. Alternatively, `npm run build && npm start` runs the production build without file watchers.
