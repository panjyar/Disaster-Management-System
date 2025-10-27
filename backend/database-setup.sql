-- Enable PostGIS
create extension if not exists postgis;

-- disasters
create table if not exists disasters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location_name text,
  location geography(Point, 4326),
  description text not null,
  tags text[] default '{}',
  owner_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  audit_trail jsonb
);

-- resources
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  disaster_id uuid references disasters(id) on delete cascade,
  name text not null,
  location_name text,
  location geography(Point, 4326),
  type text not null,
  description text,
  contact_info text,
  availability text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- reports
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  disaster_id uuid references disasters(id) on delete cascade,
  user_id text,
  content text not null,
  image_url text,
  verification_status text default 'pending',
  created_at timestamptz default now()
);

-- cache
create table if not exists cache (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz not null
);

-- Indexes
create index if not exists disasters_location_idx on disasters using gist (location);
create index if not exists resources_location_idx on resources using gist (location);
create index if not exists disasters_tags_idx on disasters using gin (tags);
create index if not exists disasters_owner_idx on disasters (owner_id);

-- Nearby resources RPC
create or replace function nearby_resources(lon double precision, lat double precision, radius_m integer, p_disaster_id uuid)
returns setof resources
language sql
stable
as $$
  select r.*
  from resources r
  where r.disaster_id = p_disaster_id
    and r.location is not null
    and ST_DWithin(r.location, ST_SetSRID(ST_Point(lon, lat), 4326)::geography, radius_m);
$$;
