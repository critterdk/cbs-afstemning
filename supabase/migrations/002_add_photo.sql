-- Adds photo support to nominations. Run this once in the Supabase SQL
-- Editor against the already-deployed database (schema.sql already has
-- this baked in for fresh installs).

alter table nominations add column if not exists photo_url text;

-- photo_url is appended at the end, not inserted between existing columns:
-- CREATE OR REPLACE VIEW only allows adding new columns after the
-- pre-existing ones (Postgres error 42P16 otherwise).
create or replace view nomination_results as
select
  n.id,
  n.nominee_name,
  n.reasoning,
  n.created_at,
  count(v.id)::int as vote_count,
  n.photo_url
from nominations n
left join votes v on v.nomination_id = n.id
where n.status = 'approved'
group by n.id
order by vote_count desc, n.created_at asc;

-- Explicit column list (not n.*): n.* would place the newly-appended
-- photo_url column before vote_count in the output, hitting the same
-- 42P16 rename error CREATE OR REPLACE VIEW raised above.
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
  count(v.id)::int as vote_count,
  n.photo_url
from nominations n
left join votes v on v.nomination_id = n.id
group by n.id
order by n.created_at desc;
