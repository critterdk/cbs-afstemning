-- CBS-Afstemning schema — Årets Cykelhelt
--
-- Visitors nominate a candidate (nominee_name + reasoning) and must confirm
-- their own email before the nomination goes live. Once live, anyone can
-- vote for it (one vote per browser, enforced by a cookie + unique
-- voter_token). Nominators can opt in to a prize raffle.

create table if not exists nominations (
  id uuid primary key default gen_random_uuid(),
  nominee_name text not null,
  reasoning text not null,
  photo_url text,
  submitter_name text not null,
  submitter_email text not null,
  raffle_opt_in boolean not null default false,
  status text not null default 'unverified', -- unverified | approved | rejected
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references nominations(id) on delete cascade,
  voter_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists votes_nomination_id_idx on votes(nomination_id);
create index if not exists nominations_status_idx on nominations(status);

-- Public read model: only approved nominations, ranked by vote count. Does
-- not expose submitter_name/submitter_email — those stay admin-only.
create or replace view nomination_results as
select
  n.id,
  n.nominee_name,
  n.reasoning,
  n.photo_url,
  n.created_at,
  count(v.id)::int as vote_count
from nominations n
left join votes v on v.nomination_id = n.id
where n.status = 'approved'
group by n.id
order by vote_count desc, n.created_at asc;

-- Admin read model: every nomination regardless of status, with vote counts
-- and submitter details, for moderation and the raffle draw. Only reachable
-- via the service role key (see app/api/admin/nominations), never granted
-- to anon/authenticated.
create or replace view nomination_admin_view as
select
  n.*,
  count(v.id)::int as vote_count
from nominations n
left join votes v on v.nomination_id = n.id
group by n.id
order by n.created_at desc;

alter table nominations enable row level security;
alter table votes enable row level security;

-- No public policies on the base `nominations` table — it holds
-- submitter_email etc. The public only ever reads the filtered
-- `nomination_results` view. All writes (nominate, verify, vote, admin
-- moderation) go through server routes using the service role key, which
-- bypasses RLS.
grant select on nomination_results to anon, authenticated;
