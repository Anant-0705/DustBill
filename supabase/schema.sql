-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  first_name text,
  last_name text,
  business_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- CLIENTS
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.clients enable row level security;

create policy "Users can view their own clients" on public.clients
  for select using (auth.uid() = user_id);

create policy "Users can insert their own clients" on public.clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own clients" on public.clients
  for update using (auth.uid() = user_id);

create policy "Users can delete their own clients" on public.clients
  for delete using (auth.uid() = user_id);

-- CONTRACTS
create table public.contracts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients,
  title text not null,
  description text,
  content text not null,
  terms text,
  status text check (status in ('draft', 'sent', 'accepted', 'rejected')) default 'draft',
  share_token text unique,
  signed_date timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.contracts enable row level security;

create policy "Users can view their own contracts" on public.contracts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own contracts" on public.contracts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own contracts" on public.contracts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own contracts" on public.contracts
  for delete using (auth.uid() = user_id);

-- Public access for contracts via share_token (for clients to view)
create policy "Public can view contracts with valid token" on public.contracts
  for select using (share_token is not null);

create policy "Public can update contracts with valid token" on public.contracts
  for update using (share_token is not null);

-- INVOICES
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients,
  contract_id uuid references public.contracts,
  status text check (status in ('draft', 'pending', 'approved', 'paid', 'rejected', 'overdue')) default 'draft',
  amount numeric not null default 0,
  currency text default 'USD',
  due_date date,
  items jsonb default '[]'::jsonb,
  share_token text unique,
  rejection_reason text,
  rejection_date timestamp with time zone,
  approved_date timestamp with time zone,
  client_email_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoices enable row level security;

create policy "Users can view their own invoices" on public.invoices
  for select using (auth.uid() = user_id);

create policy "Users can insert their own invoices" on public.invoices
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own invoices" on public.invoices
  for update using (auth.uid() = user_id);

create policy "Users can delete their own invoices" on public.invoices
  for delete using (auth.uid() = user_id);

-- Public access for invoices via share_token (for clients to view)
create policy "Public can view invoices with valid token" on public.invoices
  for select using (true); -- Requires application-level filtering by token or more specific RLS if possible, but simplified for shareable links

-- Public access for invoices via share_token (for clients to update - approve/reject)
create policy "Public can update invoices with valid token" on public.invoices
  for update using (share_token is not null);

-- PAYMENTS
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices not null,
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  amount numeric not null,
  currency text default 'USD',
  status text check (status in ('pending', 'success', 'failed')) default 'pending',
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payments enable row level security;

create policy "Users can view payments for their invoices" on public.payments
  for select using (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.payments.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

-- Public can insert payments (for client payments via share link)
create policy "Public can insert payments" on public.payments
  for insert with check (true);

-- EMAIL LOGS
create table public.email_logs (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices,
  contract_id uuid references public.contracts,
  recipient_email text not null,
  email_type text check (email_type in ('invoice_sent', 'invoice_approved', 'invoice_rejected', 'contract_sent', 'payment_received')) not null,
  subject text,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('sent', 'failed', 'pending')) default 'pending'
);

alter table public.email_logs enable row level security;

create policy "Users can view their own email logs" on public.email_logs
  for select using (
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

create policy "Service role can update email logs" on public.email_logs
  for update using (true);

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
