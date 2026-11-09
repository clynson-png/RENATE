-- RENATE: keep only the three user-provided lead contact fields.
drop policy if exists renate_leads_insert_validated on public.leads;
revoke all privileges on table public.leads from public, anon, authenticated;

alter table public.leads
  drop constraint if exists leads_consent_required,
  drop column if exists consent_accepted,
  drop column if exists consent_version;

grant insert (full_name, email, phone) on table public.leads to anon;

create policy renate_leads_insert_validated
  on public.leads
  for insert
  to anon
  with check (
    char_length(btrim(full_name)) between 2 and 160
    and char_length(email) between 5 and 254
    and email = lower(email)
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and char_length(phone) between 7 and 32
    and phone ~ '^[+0-9() .-]+$'
  );

-- RLS remains enabled; anon has no SELECT, UPDATE, or DELETE privileges.
