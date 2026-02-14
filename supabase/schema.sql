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

-- INVOICES
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients,
  status text check (status in ('draft', 'pending', 'paid', 'overdue')) default 'draft',
  amount numeric not null default 0,
  currency text default 'USD',
  due_date date,
  items jsonb default '[]'::jsonb,
  share_token text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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

-- PAYMENTS
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices not null,
  razorpay_payment_id text,
  amount numeric not null,
  status text,
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
