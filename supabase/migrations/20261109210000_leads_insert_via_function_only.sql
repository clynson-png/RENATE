-- Public lead registrations must pass server-side Turnstile validation in
-- the renate-lead-registration Edge Function. Remove the direct table path.
drop policy if exists renate_leads_insert_validated on public.leads;
revoke all privileges on table public.leads from public, anon, authenticated;
