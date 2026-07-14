-- Votes now require the voter's name + a confirmed email, same as
-- nominations. Run this once in the Supabase SQL Editor.
--
-- Safe to run as a plain ALTER since the votes table is empty in
-- production at the time this was written (no cookie-based votes to
-- migrate) — if that's no longer true, back up first.

alter table votes drop constraint if exists votes_voter_token_key;
alter table votes drop column if exists voter_token;

alter table votes add column voter_name text not null;
alter table votes add column voter_email text not null;
alter table votes add column status text not null default 'unverified'; -- unverified | confirmed
alter table votes add column verification_token text;
alter table votes add column verified_at timestamptz;

-- One vote per person per nominee (not one vote total) — someone can
-- back multiple different nominees, just not the same one twice.
create unique index votes_nomination_email_idx on votes (nomination_id, lower(voter_email));

-- Only count confirmed votes. Column list/order otherwise unchanged
-- from migration 002, so no 42P16 append-only conflict.
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
