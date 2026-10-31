-- InfraWatch AI prototype schema
-- Apply in the Supabase SQL editor or with psql.
-- The Next.js server uses the service role. Row level security is enabled
-- with no policies, so the anon key cannot read these tables.

create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key,
  project_name text not null,
  description text,
  state text not null default 'Maharashtra',
  district text,
  location_name text,
  latitude double precision,
  longitude double precision,
  coordinate_source text,
  infrastructure_category text not null,
  baseline_criticality_tier smallint not null check (baseline_criticality_tier between 1 and 5),
  contextual_criticality_score numeric not null,
  proposed_criticality_tier smallint not null check (proposed_criticality_tier between 1 and 5),
  classification_rationale text,
  classification_method text,
  classification_review_status text not null default 'proposed',
  contextual_factors jsonb,
  lifecycle_status text not null,
  reported_lifecycle_status text,
  investment_amount numeric,
  currency text,
  investment_status text,
  expected_completion_date date,
  completion_date_status text,
  record_origin text not null,
  synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sources (
  id uuid primary key,
  source_url text,
  title text,
  publisher text,
  source_type text not null,
  language text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  raw_content text,
  content_hash text not null unique,
  full_text_retrieved boolean not null default false
);

create table if not exists events (
  id uuid primary key,
  project_id uuid not null references projects (id) on delete cascade,
  source_id uuid not null references sources (id) on delete cascade,
  event_type text not null,
  reported_claim text not null,
  extracted_data jsonb,
  evidence_status text not null,
  ai_recommended_status text,
  recommendation_rationale text,
  event_date date,
  pipeline_mode text,
  created_at timestamptz not null default now()
);

create table if not exists evidence (
  id uuid primary key,
  event_id uuid not null references events (id) on delete cascade,
  source_id uuid not null references sources (id) on delete cascade,
  evidence_type text not null,
  evidence_description text not null,
  supporting_or_conflicting text not null,
  review_status text not null default 'pending'
);

create table if not exists review_logs (
  id uuid primary key,
  event_id uuid not null references events (id) on delete cascade,
  reviewer_action text not null,
  reviewer_notes text,
  previous_status text not null,
  new_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists correlation_candidates (
  id uuid primary key,
  event_id uuid not null references events (id) on delete cascade,
  candidate_project_id uuid not null references projects (id) on delete cascade,
  score numeric not null,
  rationale text,
  auto_linked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists events_project_id_idx on events (project_id);
create index if not exists events_evidence_status_idx on events (evidence_status);
create index if not exists evidence_event_id_idx on evidence (event_id);
create index if not exists review_logs_event_id_idx on review_logs (event_id);

alter table projects enable row level security;
alter table sources enable row level security;
alter table events enable row level security;
alter table evidence enable row level security;
alter table review_logs enable row level security;
alter table correlation_candidates enable row level security;
