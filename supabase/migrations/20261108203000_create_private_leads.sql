-- RENATE: one-time lead registration only; all consultation data stays on device.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  consent_accepted boolean not null default false,
  consent_version text not null default 'RENATE_LEAD_NOTICE_V1',
  created_at timestamptz not null default now(),
  constraint leads_full_name_valid check (char_length(btrim(full_name)) between 2 and 160),
  constraint leads_email_valid check (
    char_length(email) between 5 and 254
    and email = lower(email)
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint leads_phone_valid check (
    char_length(phone) between 7 and 32
    and phone ~ '^[+0-9() .-]+$'
  ),
  constraint leads_consent_required check (consent_accepted is true)
);

create unique index if not exists leads_email_unique on public.leads (email);

comment on table public.leads is
  'RENATE initial registration contact leads. Conversation, PIN, queries and usage history are not stored here.';

alter table public.leads enable row level security;
revoke all privileges on table public.leads from public, anon, authenticated;
grant insert (full_name, email, phone, consent_accepted, consent_version) on table public.leads to anon;

drop policy if exists renate_leads_insert_validated on public.leads;
create policy renate_leads_insert_validated
  on public.leads
  for insert
  to anon
  with check (
    consent_accepted is true
    and char_length(btrim(full_name)) between 2 and 160
    and char_length(email) between 5 and 254
    and email = lower(email)
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and char_length(phone) between 7 and 32
    and phone ~ '^[+0-9() .-]+$'
  );

-- No SELECT, UPDATE, or DELETE grants or policies are created for client roles.
