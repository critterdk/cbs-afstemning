# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CBS-Afstemning — public nomination + voting site for Copenhagen Bike Show's "Årets Cykelhelt" (Cycling Hero of the Year) award, embeddable on the Best One WordPress site (copenhagenbikeshow.dk) the same way as [CBS Industry Hub](../cbs-industry-hub). UI copy is in Danish. Deployed on Vercel.

Currently a single award/poll — if a second award category is added later, `nominations` will need an `award` discriminator column and the UI a way to switch between them. Don't add that speculatively before it's needed.

## Commands

```
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint
```

There is no test suite configured in this repo.

## Architecture

**Stack:** Next.js App Router (v16, React 19) + Supabase (Postgres) for storage + Resend for email. Tailwind v4 for styling.

### Nomination + voting flow

1. **Nominate** — anyone can nominate a candidate via the form in [components/NominationForm.tsx](components/NominationForm.tsx) (rendered inside [components/NominationsSection.tsx](components/NominationsSection.tsx)). They submit `nominee_name` + `reasoning` (the public-facing case for the nominee), an optional photo, plus their own `submitter_name` + `submitter_email` and an opt-in `raffle_opt_in` checkbox (default off) for a >1000kr prize draw. The form posts `multipart/form-data` (not JSON) so the photo file can ride along. `app/api/nominate/route.ts` validates the photo (image mime type, ≤5MB), uploads it to the public `nomination-photos` Supabase Storage bucket, and inserts the row as `status: "unverified"` with a `verification_token`, then emails a confirmation link to the submitter via [lib/email.ts](lib/email.ts) (Resend; silently no-ops if `RESEND_API_KEY` is unset).
2. **Verify** — clicking the emailed link hits `app/api/verify/route.ts`, which flips the row to `status: "approved"` (visible + votable) and emails the admin a notification. No token = no publish; this is the anti-spam gate, there is no separate manual approval step required before a verified nomination goes live.
3. **Vote** — `app/api/vote/route.ts` lets anyone vote for an *approved* nomination once per browser, enforced by an httpOnly `afstemning_voter` cookie plus a unique constraint on `votes.voter_token` (race-safe: handles Postgres error code `23505`). `GET` reports whether the current browser has already voted (and for whom), so the UI can show results instead of the ballot on repeat visits.
4. **Display** — [components/NominationsSection.tsx](components/NominationsSection.tsx) reads the `nomination_results` view (anon key, client-side), ranked by vote count. It deliberately does not expose `submitter_name`/`submitter_email` — those are admin-only.
5. **Moderation** — `app/admin/page.tsx` is a password-gated SPA listing every nomination (any status) via `app/api/admin/nominations` (service role, reads the unfiltered `nomination_admin_view`), with submitter details, raffle flag, and vote count. Admin can approve/reject (`PATCH` status) or permanently delete (`DELETE`, cascades votes) — same shared-secret auth model as CBS Industry Hub: `x-admin-password` header checked against `ADMIN_PASSWORD` env var, kept in component state and resent with every request, no per-user auth or session.

### Widget embedding

`app/widget/page.tsx` is a stripped-down page meant to be embedded via `<iframe>` on the Best One WordPress site — see [docs/wordpress-embed.md](docs/wordpress-embed.md). [components/WidgetAutoHeight.tsx](components/WidgetAutoHeight.tsx) posts the widget's content height to the parent frame via `postMessage` so the embedding iframe can resize itself.

### Supabase access patterns

[lib/supabase.ts](lib/supabase.ts) exposes two client factories, both lazily initialized so a missing env var throws only when called, not at build/import time:
- `getSupabaseClient()` — anon key, browser-side reads of `nomination_results` only.
- `createServiceClient()` — service role key, used server-side (API routes) for all writes and for admin reads of `nomination_admin_view`, bypassing RLS.

[supabase/schema.sql](supabase/schema.sql) defines `nominations`, `votes`, and two views: `nomination_results` (public — approved only, no submitter PII, includes `photo_url`) and `nomination_admin_view` (unfiltered, includes submitter details — only reachable via the service role key, never granted to anon/authenticated). RLS is enabled on both base tables with **no** public policies on `nominations` itself (it holds `submitter_email`); all writes go through the service-role API routes. Schema changes after the initial deploy live as one-off files in `supabase/migrations/` — run manually in the SQL Editor against the live database, since there's no migration runner wired up.

If `NEXT_PUBLIC_SUPABASE_URL` isn't set, [components/NominationsSection.tsx](components/NominationsSection.tsx) falls back to fixture data in [lib/mockData.ts](lib/mockData.ts) — this is what local dev without Supabase configured will show. Nominate/vote still hit the real API routes in that case and will error since there's no database.
