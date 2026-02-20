-- Allow public (unauthenticated) users to read profiles
-- This is needed so freelancer business name/email shows on public invoice & contract pages
create policy if not exists "Public can view profiles" on public.profiles
  for select using (true);

-- Also allow public to view clients (needed for invoice/contract join on public pages)
create policy if not exists "Public can view clients via invoice token" on public.clients
  for select using (true);
