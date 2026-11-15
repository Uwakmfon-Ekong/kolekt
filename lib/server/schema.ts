/**
 * Kolekt database schema. Idempotent: it runs on every boot.
 * The same SQL is in supabase/schema.sql for the Supabase SQL editor.
 */
export const SCHEMA_SQL = /* sql */ `
create table if not exists organisers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  photo text,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  organiser_id uuid not null references organisers(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid not null references organisers(id) on delete cascade,
  public_code text not null unique,
  slug text not null unique,
  title text not null,
  description text not null default '',
  organisation text not null default '',
  cover_image text,
  collection_type text not null check (collection_type in ('fixed','flexible')),
  fixed_amount numeric(14,2),
  min_amount numeric(14,2),
  target_amount numeric(14,2),
  allow_above_target boolean not null default true,
  deadline date,
  contributor_fields jsonb not null default '["Full Name"]',
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now()
);
create index if not exists collections_organiser_idx on collections(organiser_id);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  reference text not null unique,
  amount numeric(14,2) not null,
  amount_to_pay numeric(14,2),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','successful','failed','expired')),
  review_status text not null default 'none' check (review_status in ('none','duplicate')),
  payer_name text not null,
  payer_email text,
  payer_phone text,
  payer_key text not null,
  payer_details jsonb not null default '{}',
  provider_reference text,
  payment_method text,
  payment_instructions jsonb,
  provider_mode text not null default 'mock',
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists transactions_collection_idx on transactions(collection_id, status);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete set null,
  provider_event_reference text not null unique,
  event_type text,
  hash_valid boolean not null,
  verification_status text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

-- Only used in demo mode: stands in for Paga's ledger so the verification step can be "queried".
create table if not exists mock_paga_payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  amount numeric(14,2) not null,
  created_at timestamptz not null default now()
);
`;
