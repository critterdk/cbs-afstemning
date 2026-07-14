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

-- Voting requires the voter's name + a confirmed email (verification_token
-- / status mirror the nominations flow). One vote per person per nominee:
-- unique on (nomination_id, lower(voter_email)), not on voter_email alone,
-- so the same person can back multiple different nominees.
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references nominations(id) on delete cascade,
  voter_name text not null,
  voter_email text not null,
  status text not null default 'unverified', -- unverified | confirmed
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists votes_nomination_id_idx on votes(nomination_id);
create unique index if not exists votes_nomination_email_idx on votes (nomination_id, lower(voter_email));
create index if not exists nominations_status_idx on nominations(status);

-- Public read model: only approved nominations, ranked by vote count.
-- Results are visible to everyone regardless of whether they've voted —
-- vote confirmation is asynchronous (email link), so there's no reliable
-- "have I voted" browser state to gate results on. Does not expose
-- submitter_name/submitter_email — those stay admin-only. Only confirmed
-- votes count.
create or replace view nomination_results as
select
  n.id,
  n.nominee_name,
  n.reasoning,
  n.created_at,
  count(v.id) filter (where v.status = 'confirmed')::int as vote_count,
  n.photo_url
from nominations n
left join votes v on v.nomination_id = n.id
where n.status = 'approved'
group by n.id
order by vote_count desc, n.created_at asc;

-- Admin read model: every nomination regardless of status, with confirmed
-- vote counts and submitter details, for moderation and the raffle draw.
-- Only reachable via the service role key (see app/api/admin/nominations),
-- never granted to anon/authenticated.
create or replace view nomination_admin_view as
select
  n.id,
  n.nominee_name,
  n.reasoning,
  n.submitter_name,
  n.submitter_email,
  n.raffle_opt_in,
  n.status,
  n.verification_token,
  n.verified_at,
  n.created_at,
  count(v.id) filter (where v.status = 'confirmed')::int as vote_count,
  n.photo_url
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
