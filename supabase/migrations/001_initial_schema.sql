-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Investments (generic container)
create table public.investments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('briq', 'fund', 'land', 'custom')),
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Briq investments
create table public.briq_investments (
  id uuid primary key default uuid_generate_v4(),
  investment_id uuid references public.investments(id) on delete cascade not null unique,
  annual_interest_rate numeric(6,2) not null,
  invested_amount numeric(14,2) not null,
  investment_date date not null,
  term_months integer
);

-- Investment Funds
create table public.fund_transactions (
  id uuid primary key default uuid_generate_v4(),
  fund_id uuid references public.investments(id) on delete cascade not null,
  transaction_date date not null,
  titles_quantity numeric(14,4) not null,
  title_cost numeric(14,6) not null,
  total_amount numeric(14,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.fund_title_history (
  id uuid primary key default uuid_generate_v4(),
  fund_id uuid references public.investments(id) on delete cascade not null,
  date date not null,
  title_value numeric(14,6) not null,
  created_at timestamptz not null default now(),
  unique (fund_id, date)
);

-- Land Purchases
create table public.land_details (
  id uuid primary key default uuid_generate_v4(),
  investment_id uuid references public.investments(id) on delete cascade not null unique,
  total_price numeric(14,2) not null,
  purchase_date date not null,
  payment_frequency text not null default 'monthly' check (payment_frequency in ('monthly', 'biweekly', 'custom'))
);

create table public.land_payments (
  id uuid primary key default uuid_generate_v4(),
  land_id uuid references public.land_details(id) on delete cascade not null,
  payment_date date not null,
  amount numeric(14,2) not null,
  payment_type text not null check (payment_type in ('initial', 'installment', 'expense')),
  description text,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_investments_updated_at
  before update on public.investments
  for each row execute function public.handle_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS policies
alter table public.profiles enable row level security;
alter table public.investments enable row level security;
alter table public.briq_investments enable row level security;
alter table public.fund_transactions enable row level security;
alter table public.fund_title_history enable row level security;
alter table public.land_details enable row level security;
alter table public.land_payments enable row level security;

-- Profiles: users see own, admins see all
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "profiles_admin_insert" on public.profiles for insert
  with check (auth.uid() = id);

-- Investments: users see own, admins see all
create policy "investments_select" on public.investments for select
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "investments_insert" on public.investments for insert
  with check (user_id = auth.uid());
create policy "investments_update" on public.investments for update
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "investments_delete" on public.investments for delete
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- Briq
create policy "briq_all" on public.briq_investments for all
  using (exists (
    select 1 from public.investments i where i.id = investment_id
      and (i.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
  ));

-- Fund transactions
create policy "fund_transactions_all" on public.fund_transactions for all
  using (exists (
    select 1 from public.investments i where i.id = fund_id
      and (i.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
  ));

-- Fund title history
create policy "fund_title_history_all" on public.fund_title_history for all
  using (exists (
    select 1 from public.investments i where i.id = fund_id
      and (i.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
  ));

-- Land details
create policy "land_details_all" on public.land_details for all
  using (exists (
    select 1 from public.investments i where i.id = investment_id
      and (i.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
  ));

-- Land payments
create policy "land_payments_all" on public.land_payments for all
  using (exists (
    select 1 from public.land_details ld
    join public.investments i on i.id = ld.investment_id
    where ld.id = land_id
      and (i.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
  ));
