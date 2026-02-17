-- Drop existing policies if they exist
drop policy if exists "Users can insert email logs for their own invoices/contracts" on public.email_logs;
drop policy if exists "Service role can update email logs" on public.email_logs;

-- Add INSERT policy for email_logs
create policy "Users can insert email logs for their own invoices/contracts" on public.email_logs
  for insert with check (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.email_logs.invoice_id
      and public.invoices.user_id = auth.uid()
    ) or exists (
      select 1 from public.contracts
      where public.contracts.id = public.email_logs.contract_id
      and public.contracts.user_id = auth.uid()
    )
  );

-- Add UPDATE policy for email_logs (allows service role to update)
create policy "Service role can update email logs" on public.email_logs
  for update using (true);
