-- ==============================================================================
-- GIRI JEWELLERS - SUPABASE DATABASE SCHEMA MIGRATION
-- Project: https://syspsywxcutkwgjazxsb.supabase.co
-- Paste and Run this entire file in your Supabase SQL Editor:
-- (Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Create categories table
create table if not exists public.categories (
    id text primary key,
    name text not null,
    color text default '#dfb76c',
    description text default '',
    is_default boolean default false,
    created_at timestamptz default now()
);

-- 2. Create customers table
create table if not exists public.customers (
    id text primary key,
    name text not null,
    email text default '',
    phone text not null,
    category_id text references public.categories(id) on delete set null,
    category_name text default '',
    address text default '',
    city text default '',
    place text default '',
    referred_by text default '',
    notes text default '',
    tags text[] default '{}',
    status text default 'active' check (status in ('active', 'lead', 'inactive')),
    source text default 'walkin_qr' check (source in ('walkin_qr', 'manual', 'import', 'website')),
    scan_id text,
    created_by text default 'Store Staff',
    quality_score integer default 100,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for high-speed search and deduplication
create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_email on public.customers (email);
create index if not exists idx_customers_created_at on public.customers (created_at desc);

-- 3. Create store_settings table
create table if not exists public.store_settings (
    id text primary key default 'primary',
    business_name text not null default 'GIRI JEWELLERS',
    tagline text default 'Fine Gold, Diamond & Heritage Bridal Jewellery',
    branch_name text default 'Trivandrum Flagship Showroom',
    address text default 'MG Road, Overbridge Junction, East Fort',
    city text default 'Thiruvananthapuram',
    state text default 'Kerala',
    pincode text default '695001',
    phone text default '+91 98470 54321',
    whatsapp_phone text default '+91 98470 54321',
    email text default 'girijewelstvm@gmail.com',
    gstin text default '32AABCG1234F1Z9',
    bis_hallmark_number text default 'HM/C-7849201',
    currency text default '₹',
    enable_duplicate_guard boolean default true,
    min_phone_digits integer default 10,
    default_category_id text default 'cat-1',
    auto_format_names boolean default true,
    require_city_on_walkin boolean default true,
    standee_tagline text default 'Scan to join VIP rewards & fast showroom customer intake',
    qr_intake_active boolean default true,
    qr_welcome_heading text default 'Welcome to GIRI JEWELLERS',
    qr_subtitle text default 'Register your counter visit for bespoke assistance, hallmark warranty & exclusive festive previews',
    qr_success_message text default 'Thank you for visiting GIRI JEWELLERS! Your showroom visit details have been registered.',
    collect_anniversary_date boolean default true,
    master_security_pin text default 'GIRI-7788',
    allow_staff_exports boolean default true,
    session_timeout_minutes integer default 60,
    updated_at timestamptz default now()
);

-- 4. Create staff_users table
create table if not exists public.staff_users (
    id text primary key,
    name text not null,
    email text not null,
    role text not null default 'staff',
    password text default '',
    phone text default '',
    avatar text default '💎',
    token text default '',
    permissions jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- 5. Create qr_scans table
create table if not exists public.qr_scans (
    id text primary key,
    scan_id text not null,
    timestamp timestamptz default now(),
    user_agent text default '',
    device_type text default 'mobile',
    os text default 'Android',
    started_filling boolean default false,
    started_at timestamptz,
    completed boolean default false,
    completed_at timestamptz,
    customer_id text,
    time_spent_seconds integer default 0
);

-- Enable Row Level Security (RLS) & Grant public access via publishable/anon key
alter table public.categories enable row level security;
alter table public.customers enable row level security;
alter table public.store_settings enable row level security;
alter table public.staff_users enable row level security;
alter table public.qr_scans enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow all operations for anon on categories" on public.categories;
drop policy if exists "Allow all operations for anon on customers" on public.customers;
drop policy if exists "Allow all operations for anon on store_settings" on public.store_settings;
drop policy if exists "Allow all operations for anon on staff_users" on public.staff_users;
drop policy if exists "Allow all operations for anon on qr_scans" on public.qr_scans;

-- Create open policies for publishable / anon client
create policy "Allow all operations for anon on categories" on public.categories for all using (true) with check (true);
create policy "Allow all operations for anon on customers" on public.customers for all using (true) with check (true);
create policy "Allow all operations for anon on store_settings" on public.store_settings for all using (true) with check (true);
create policy "Allow all operations for anon on staff_users" on public.staff_users for all using (true) with check (true);
create policy "Allow all operations for anon on qr_scans" on public.qr_scans for all using (true) with check (true);

-- Insert Default Showroom Categories
insert into public.categories (id, name, color, description, is_default)
values
    ('cat-1', 'Retail Walk-in', '#e09b3d', 'Counter & in-store customers', true),
    ('cat-2', 'VIP Customer', '#8a1834', 'High-value and recurring bridal buyers', false),
    ('cat-3', 'Wholesale / B2B', '#b38234', 'Bulk order and trade inquiries', false)
on conflict (id) do nothing;

-- Insert Default Showroom Settings
insert into public.store_settings (id, business_name, tagline, branch_name)
values ('primary', 'GIRI JEWELLERS', 'Fine Gold, Diamond & Heritage Bridal Jewellery', 'Trivandrum Flagship Showroom')
on conflict (id) do nothing;
