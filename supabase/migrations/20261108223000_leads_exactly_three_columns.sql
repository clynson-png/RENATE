-- RENATE: the leads table stores only the three user-approved contact fields.
alter table public.leads
  drop constraint if exists leads_pkey,
  drop column if exists id,
  drop column if exists created_at;

-- Keep the existing unique email index, contact-field checks, RLS policy and
-- INSERT-only grants for anon. No generated or audit columns remain.
