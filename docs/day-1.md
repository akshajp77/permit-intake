# Day 1 handoff

One developer owns platform, AI and interface today. Work in one task branch and integrate continuously; do not create three conflicting copies.

## Scope implemented

- Next.js 16 / React 19 / TypeScript, Node 24, npm lockfile and GitHub checks.
- Responsive sample queue and review workspace with explicit sample labeling.
- Real Supabase email-code login, verified server user, cookie refresh, logout.
- Server-authorized project creation and live RLS-filtered project list.
- Foundation SQL: organizations, memberships, projects, submissions, documents, review runs, private storage.
- Shared Zod contracts, bounded PDF extraction and exact-text citation validation.
- Complete/missing synthetic PDFs and a configurable real-model CLI spike.

## Finish Day 1 after credentials

1. Apply the migration to a NEW Supabase development project.
2. Configure email token template and SMTP; verify login with an external email.
3. Run rollback-only isolation SQL and browser checks with two users.
4. Set an available OpenAI model and API key locally, then run both smoke fixtures.
5. Push to a private GitHub repo and deploy a Vercel preview.

## Day 2

Implement source-linked checklist publication, authenticated private direct uploads, server-side PDF validation and submission freezing, then durable run dispatch and progress polling. Keep uploaded files immutable after review begins. Store worker proposals separately from staff decisions. The existing sample is not that workflow.

The demo checklist is illustrative, not a verified Prosper checklist. Import and review the official source before implementing jurisdiction rules. No city endorsement or actual compliance determination is implied.

## Verification recorded

Local lint, seven tests (including actual synthetic PDF extraction), production build, and TypeScript passed. npm install reported zero known dependency vulnerabilities. Supabase isolation SQL, external OTP delivery and paid AI smoke tests are pending credentials.

Browser checks passed: export blocked until all sample decisions exist; text download works; 390px sample layout has no horizontal overflow; unconfigured login is disabled.
