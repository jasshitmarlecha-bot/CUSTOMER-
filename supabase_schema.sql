-- ==============================================================================
-- GIRI JEWELLERS - COMPLETE STANDALONE DATABASE SETUP (ALL-IN-ONE SQL)
-- Project: https://syspsywxcutkwgjazxsb.supabase.co
--
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/syspsywxcutkwgjazxsb
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query" (or "+" button)
-- 4. Paste this entire file into the editor and click "RUN" (or Ctrl+Enter)
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. CATEGORIES TABLE
-- ==============================================================================
create table if not exists public.categories (
    id text primary key default concat('cat-', substr(md5(random()::text), 1, 8)),
    name text not null,
    color text default '#dfb76c',
    description text default '',
    is_default boolean default false,
    created_at timestamptz default now()
);

-- ==============================================================================
-- 2. CUSTOMERS TABLE
-- ==============================================================================
create table if not exists public.customers (
    id text primary key default concat('cust-', substr(md5(random()::text), 1, 10)),
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

-- Indexes for lightning-fast search, duplicate checking & filtering
create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_email on public.customers (email);
create index if not exists idx_customers_name on public.customers (lower(name));
create index if not exists idx_customers_status on public.customers (status);
create index if not exists idx_customers_category on public.customers (category_id);
create index if not exists idx_customers_created_at on public.customers (created_at desc);

-- ==============================================================================
-- 3. STORE SETTINGS TABLE
-- ==============================================================================
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
    last_backup_date timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==============================================================================
-- 4. STAFF USERS TABLE
-- ==============================================================================
create table if not exists public.staff_users (
    id text primary key default concat('user-', substr(md5(random()::text), 1, 8)),
    name text not null,
    email text not null unique,
    role text not null default 'staff' check (role in ('admin', 'manager', 'staff')),
    password text default '',
    phone text default '',
    avatar text default '💎',
    token text default '',
    permissions jsonb default '{
        "canViewCustomers": true,
        "canAddEditCustomers": true,
        "canDeleteCustomers": false,
        "canExportData": true,
        "canImportData": false,
        "canPrintData": true,
        "canManageCategories": false,
        "canRunCleaning": false,
        "canViewAnalytics": true,
        "canViewCommonQR": true
    }'::jsonb,
    created_at timestamptz default now()
);

-- ==============================================================================
-- 5. QR SCANS TABLE
-- ==============================================================================
create table if not exists public.qr_scans (
    id text primary key default concat('scan-', substr(md5(random()::text), 1, 10)),
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

create index if not exists idx_qr_scans_scan_id on public.qr_scans (scan_id);
create index if not exists idx_qr_scans_timestamp on public.qr_scans (timestamp desc);

-- ==============================================================================
-- 6. AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
    before update on public.customers
    for each row
    execute function public.handle_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
    before update on public.store_settings
    for each row
    execute function public.handle_updated_at();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- ==============================================================================
alter table public.categories enable row level security;
alter table public.customers enable row level security;
alter table public.store_settings enable row level security;
alter table public.staff_users enable row level security;
alter table public.qr_scans enable row level security;

-- Drop all old policies to guarantee idempotent re-runs
drop policy if exists "Categories open policy" on public.categories;
drop policy if exists "Customers open policy" on public.customers;
drop policy if exists "Settings open policy" on public.store_settings;
drop policy if exists "Staff users open policy" on public.staff_users;
drop policy if exists "QR scans open policy" on public.qr_scans;

drop policy if exists "Allow all operations for anon on categories" on public.categories;
drop policy if exists "Allow all operations for anon on customers" on public.customers;
drop policy if exists "Allow all operations for anon on store_settings" on public.store_settings;
drop policy if exists "Allow all operations for anon on staff_users" on public.staff_users;
drop policy if exists "Allow all operations for anon on qr_scans" on public.qr_scans;

-- Create comprehensive permissive policies (works for both anon publishable key and authenticated staff)
create policy "Categories open policy" on public.categories
    for all using (true) with check (true);

create policy "Customers open policy" on public.customers
    for all using (true) with check (true);

create policy "Settings open policy" on public.store_settings
    for all using (true) with check (true);

create policy "Staff users open policy" on public.staff_users
    for all using (true) with check (true);

create policy "QR scans open policy" on public.qr_scans
    for all using (true) with check (true);

-- Grant privileges to anon, authenticated, and service_role
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;

-- ==============================================================================
-- 8. REALTIME REPLICATION (Optional / High-Speed Counter Sync)
-- ==============================================================================
do $$
begin
    alter publication supabase_realtime add table public.customers;
exception when others then null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.categories;
exception when others then null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.store_settings;
exception when others then null;
end $$;

-- ==============================================================================
-- 9. DEFAULT SEED DATA (GIRI JEWELLERS SHOWROOM READY)
-- ==============================================================================

-- Default Jewellery Categories
insert into public.categories (id, name, color, description, is_default)
values
    ('cat-1', 'Retail Walk-in', '#e09b3d', 'Counter & in-store walk-in buyers', true),
    ('cat-2', 'VIP Customer', '#8a1834', 'High-value and recurring bridal buyers', false),
    ('cat-3', 'Wholesale / B2B', '#b38234', 'Bulk order and trade inquiries', false),
    ('cat-4', 'Heritage Bridal', '#72142d', 'Custom heritage temple & bridal gold orders', false)
on conflict (id) do update set
    name = excluded.name,
    color = excluded.color,
    description = excluded.description;

-- Default Showroom Settings
insert into public.store_settings (
    id,
    business_name,
    tagline,
    branch_name,
    address,
    city,
    state,
    pincode,
    phone,
    whatsapp_phone,
    email,
    gstin,
    bis_hallmark_number,
    currency,
    master_security_pin
) values (
    'primary',
    'GIRI JEWELLERS',
    'Fine Gold, Diamond & Heritage Bridal Jewellery',
    'Trivandrum Flagship Showroom',
    'MG Road, Overbridge Junction, East Fort',
    'Thiruvananthapuram',
    'Kerala',
    '695001',
    '+91 98470 54321',
    '+91 98470 54321',
    'girijewelstvm@gmail.com',
    '32AABCG1234F1Z9',
    'HM/C-7849201',
    '₹',
    'GIRI-7788'
)
on conflict (id) do update set
    business_name = excluded.business_name,
    tagline = excluded.tagline,
    branch_name = excluded.branch_name;

-- Default Staff Accounts
insert into public.staff_users (id, name, email, role, password, avatar, token, permissions)
values
    ('user-admin-1', 'Giri Admin', 'admin@girijewels.com', 'admin', 'admin123', '💎', 'token-admin-giri', '{
        "canViewCustomers": true,
        "canAddEditCustomers": true,
        "canDeleteCustomers": true,
        "canExportData": true,
        "canImportData": true,
        "canPrintData": true,
        "canManageCategories": true,
        "canRunCleaning": true,
        "canViewAnalytics": true,
        "canViewCommonQR": true
    }'::jsonb),
    ('user-staff-1', 'Counter Staff', 'staff@girijewels.com', 'staff', 'staff123', '👩‍💼', 'token-staff-giri', '{
        "canViewCustomers": true,
        "canAddEditCustomers": true,
        "canDeleteCustomers": false,
        "canExportData": true,
        "canImportData": false,
        "canPrintData": true,
        "canManageCategories": false,
        "canRunCleaning": false,
        "canViewAnalytics": true,
        "canViewCommonQR": true
    }'::jsonb)
on conflict (id) do nothing;

-- Initial Demo Walk-in Customer Record
insert into public.customers (
    id,
    name,
    email,
    phone,
    category_id,
    category_name,
    city,
    place,
    referred_by,
    notes,
    status,
    source,
    quality_score
) values (
    'cust-demo-01',
    'Ananya Rajesh',
    'ananya.rajesh@gmail.com',
    '9847123456',
    'cat-2',
    'VIP Customer',
    'Thiruvananthapuram',
    'Kowdiar',
    'Showroom Walk-in',
    'Interested in 22KT heritage bridal choker set and diamond solitaire bangles.',
    'active',
    'walkin_qr',
    100
)
on conflict (id) do nothing;

-- ==============================================================================
-- DATABASE SETUP COMPLETE!
-- Your Supabase project is now fully initialized and ready for production.
-- ==============================================================================
