-- ==============================================================================
-- LexiGuard Database Initialization Migration
-- Extensions, Enums, Tables, Indexes, RPC Functions, and Row Level Security
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- 2. Create Enums
do $$ begin
    create type user_role as enum ('admin', 'reviewer', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
    create type contract_status as enum ('uploading', 'processing', 'analyzed', 'in_review', 'approved', 'rejected', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
    create type contract_recommendation as enum ('sign', 'negotiate', 'reject');
exception when duplicate_object then null; end $$;

do $$ begin
    create type rule_category as enum (
        'liability', 'indemnification', 'data_privacy', 'payment_penalties',
        'termination', 'ip', 'governing_law', 'confidentiality',
        'sla', 'insurance', 'other'
    );
exception when duplicate_object then null; end $$;

do $$ begin
    create type rule_severity as enum ('critical', 'high', 'medium', 'low', 'none');
exception when duplicate_object then null; end $$;

do $$ begin
    create type finding_type_enum as enum ('deviation', 'missing_clause', 'compliant');
exception when duplicate_object then null; end $$;

do $$ begin
    create type negotiation_priority_enum as enum ('must_fix', 'should_fix', 'nice_to_have');
exception when duplicate_object then null; end $$;

do $$ begin
    create type redline_status as enum ('pending', 'accepted', 'rejected', 'edited');
exception when duplicate_object then null; end $$;

do $$ begin
    create type score_trigger as enum ('initial', 'redline_change');
exception when duplicate_object then null; end $$;

-- 3. Core Tables

-- Organizations
create table if not exists organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Profiles (linked to auth.users)
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role user_role not null default 'reviewer',
    organization_id uuid not null references organizations(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Contracts
create table if not exists contracts (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    uploaded_by uuid references auth.users(id) on delete set null,
    vendor_name text not null,
    title text not null,
    file_path text not null,
    file_type text not null,
    file_size bigint not null default 0,
    status contract_status not null default 'uploading',
    risk_score_original int not null default 0,
    risk_score_current int not null default 0,
    recommendation contract_recommendation not null default 'negotiate',
    processing_ms int not null default 0,
    error_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Clauses
create table if not exists clauses (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid not null references contracts(id) on delete cascade,
    order_index int not null default 0,
    clause_number text,
    heading text,
    text text not null,
    page int not null default 1,
    char_start int not null default 0,
    char_end int not null default 0,
    embedding vector(1024),
    category text,
    created_at timestamptz not null default now()
);

-- Playbook Rules
create table if not exists playbook_rules (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    title text not null,
    category rule_category not null default 'other',
    requirement_text text not null,
    ideal_clause_text text not null,
    acceptable_fallback_text text not null,
    walk_away_text text not null,
    severity_default rule_severity not null default 'medium',
    weight int not null default 5,
    is_mandatory boolean not null default false,
    is_active boolean not null default true,
    regulation_tags text[] not null default '{}',
    embedding vector(1024),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Findings
create table if not exists findings (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid not null references contracts(id) on delete cascade,
    clause_id uuid references clauses(id) on delete cascade,
    playbook_rule_id uuid references playbook_rules(id) on delete set null,
    finding_type finding_type_enum not null default 'deviation',
    severity rule_severity not null default 'medium',
    similarity float not null default 0.0,
    deviation_summary text not null,
    playbook_requirement_excerpt text not null,
    vendor_text_excerpt text not null default '',
    risky_spans jsonb not null default '[]'::jsonb,
    plain_english text not null default '',
    negotiation_priority negotiation_priority_enum not null default 'should_fix',
    regulation_flags text[] not null default '{}',
    suggested_clause text not null default '',
    fallback_clause text not null default '',
    walk_away_note text not null default '',
    points int not null default 0,
    created_at timestamptz not null default now()
);

-- Redlines
create table if not exists redlines (
    id uuid primary key default gen_random_uuid(),
    finding_id uuid not null references findings(id) on delete cascade,
    contract_id uuid not null references contracts(id) on delete cascade,
    original_text text not null,
    proposed_text text not null,
    final_text text not null,
    status redline_status not null default 'pending',
    decided_by uuid references auth.users(id) on delete set null,
    decided_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Comments
create table if not exists comments (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid not null references contracts(id) on delete cascade,
    clause_id uuid references clauses(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    body text not null,
    created_at timestamptz not null default now()
);

-- Audit Logs (Append-Only)
create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    contract_id uuid references contracts(id) on delete set null,
    user_id uuid references auth.users(id) on delete set null,
    action text not null,
    entity text not null,
    entity_id text,
    metadata jsonb not null default '{}'::jsonb,
    ip text,
    created_at timestamptz not null default now()
);

-- Score Snapshots
create table if not exists score_snapshots (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid not null references contracts(id) on delete cascade,
    score int not null,
    breakdown jsonb not null default '{}'::jsonb,
    trigger score_trigger not null default 'initial',
    created_at timestamptz not null default now()
);

-- AI Usage Logs
create table if not exists ai_usage_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    contract_id uuid references contracts(id) on delete set null,
    model text not null,
    input_tokens int not null default 0,
    output_tokens int not null default 0,
    latency_ms int not null default 0,
    purpose text not null,
    created_at timestamptz not null default now()
);

-- 4. Indexes
create index if not exists idx_profiles_org on profiles(organization_id);
create index if not exists idx_contracts_org on contracts(organization_id);
create index if not exists idx_clauses_contract on clauses(contract_id);
create index if not exists idx_playbook_rules_org on playbook_rules(organization_id);
create index if not exists idx_findings_contract on findings(contract_id);
create index if not exists idx_redlines_finding on redlines(finding_id);
create index if not exists idx_redlines_contract on redlines(contract_id);
create index if not exists idx_comments_contract on comments(contract_id);
create index if not exists idx_audit_logs_org on audit_logs(organization_id);
create index if not exists idx_score_snapshots_contract on score_snapshots(contract_id);

-- Vector Indexes (HNSW for fast cosine similarity search)
create index if not exists idx_clauses_embedding on clauses using hnsw (embedding vector_cosine_ops);
create index if not exists idx_playbook_rules_embedding on playbook_rules using hnsw (embedding vector_cosine_ops);

-- 5. RPC Function: match_playbook_rules
create or replace function match_playbook_rules(
    query_embedding vector(1024),
    org_id uuid,
    match_count int default 3,
    min_similarity float default 0.3
)
returns table (
    id uuid,
    title text,
    category rule_category,
    requirement_text text,
    ideal_clause_text text,
    acceptable_fallback_text text,
    walk_away_text text,
    severity_default rule_severity,
    weight int,
    is_mandatory boolean,
    regulation_tags text[],
    similarity float
)
language plpgsql
security definer
as $$
begin
    return query
    select
        pr.id,
        pr.title,
        pr.category,
        pr.requirement_text,
        pr.ideal_clause_text,
        pr.acceptable_fallback_text,
        pr.walk_away_text,
        pr.severity_default,
        pr.weight,
        pr.is_mandatory,
        pr.regulation_tags,
        1 - (pr.embedding <=> query_embedding) as similarity
    from playbook_rules pr
    where pr.organization_id = org_id
      and pr.is_active = true
      and pr.embedding is not null
      and (1 - (pr.embedding <=> query_embedding)) >= min_similarity
    order pr.embedding <=> query_embedding asc
    limit match_count;
end;
$$;

-- 6. Helper Function: get_current_user_org_id
create or replace function get_current_user_org_id()
returns uuid
language sql
security definer
stable
as $$
    select organization_id from profiles where id = auth.uid() limit 1;
$$;

-- Helper Function: get_current_user_role
create or replace function get_current_user_role()
returns user_role
language sql
security definer
stable
as $$
    select role from profiles where id = auth.uid() limit 1;
$$;

-- 7. Row Level Security Policies

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table contracts enable row level security;
alter table clauses enable row level security;
alter table playbook_rules enable row level security;
alter table findings enable row level security;
alter table redlines enable row level security;
alter table comments enable row level security;
alter table audit_logs enable row level security;
alter table score_snapshots enable row level security;
alter table ai_usage_logs enable row level security;

-- Organizations RLS
create policy "Org members can read their organization"
    on organizations for select
    using (id = get_current_user_org_id());

create policy "Admins can update their organization"
    on organizations for update
    using (id = get_current_user_org_id() and get_current_user_role() = 'admin');

-- Profiles RLS
create policy "Users can read profiles in their org"
    on profiles for select
    using (organization_id = get_current_user_org_id());

create policy "Users can update own profile"
    on profiles for update
    using (id = auth.uid());

-- Contracts RLS
create policy "Org members can read contracts"
    on contracts for select
    using (organization_id = get_current_user_org_id());

create policy "Admins and Reviewers can insert contracts"
    on contracts for insert
    with check (
        organization_id = get_current_user_org_id()
        and get_current_user_role() in ('admin', 'reviewer')
    );

create policy "Admins and Reviewers can update contracts"
    on contracts for update
    using (
        organization_id = get_current_user_org_id()
        and get_current_user_role() in ('admin', 'reviewer')
    );

create policy "Admins can delete contracts"
    on contracts for delete
    using (
        organization_id = get_current_user_org_id()
        and get_current_user_role() = 'admin'
    );

-- Clauses RLS
create policy "Users can view clauses of their org contracts"
    on clauses for select
    using (
        exists (
            select 1 from contracts c
            where c.id = clauses.contract_id
              and c.organization_id = get_current_user_org_id()
        )
    );

create policy "Reviewers and Admins can insert/update clauses"
    on clauses for all
    using (
        exists (
            select 1 from contracts c
            where c.id = clauses.contract_id
              and c.organization_id = get_current_user_org_id()
        )
        and get_current_user_role() in ('admin', 'reviewer')
    );

-- Playbook Rules RLS
create policy "Org members can read active playbook rules"
    on playbook_rules for select
    using (organization_id = get_current_user_org_id());

create policy "Admins can modify playbook rules"
    on playbook_rules for all
    using (
        organization_id = get_current_user_org_id()
        and get_current_user_role() = 'admin'
    );

-- Findings RLS
create policy "Org members can view findings"
    on findings for select
    using (
        exists (
            select 1 from contracts c
            where c.id = findings.contract_id
              and c.organization_id = get_current_user_org_id()
        )
    );

create policy "Reviewers and Admins can modify findings"
    on findings for all
    using (
        exists (
            select 1 from contracts c
            where c.id = findings.contract_id
              and c.organization_id = get_current_user_org_id()
        )
        and get_current_user_role() in ('admin', 'reviewer')
    );

-- Redlines RLS
create policy "Org members can view redlines"
    on redlines for select
    using (
        exists (
            select 1 from contracts c
            where c.id = redlines.contract_id
              and c.organization_id = get_current_user_org_id()
        )
    );

create policy "Reviewers and Admins can update redlines"
    on redlines for all
    using (
        exists (
            select 1 from contracts c
            where c.id = redlines.contract_id
              and c.organization_id = get_current_user_org_id()
        )
        and get_current_user_role() in ('admin', 'reviewer')
    );

-- Comments RLS
create policy "Org members can view comments"
    on comments for select
    using (
        exists (
            select 1 from contracts c
            where c.id = comments.contract_id
              and c.organization_id = get_current_user_org_id()
        )
    );

create policy "Reviewers and Admins can insert comments"
    on comments for insert
    with check (
        exists (
            select 1 from contracts c
            where c.id = comments.contract_id
              and c.organization_id = get_current_user_org_id()
        )
        and get_current_user_role() in ('admin', 'reviewer')
    );

-- Audit Logs RLS: Append-Only (NO UPDATE, NO DELETE)
create policy "Org members can view audit logs"
    on audit_logs for select
    using (organization_id = get_current_user_org_id());

create policy "Service or authenticated users can insert audit logs"
    on audit_logs for insert
    with check (organization_id = get_current_user_org_id());

-- Score Snapshots RLS
create policy "Org members can view score snapshots"
    on score_snapshots for select
    using (
        exists (
            select 1 from contracts c
            where c.id = score_snapshots.contract_id
              and c.organization_id = get_current_user_org_id()
        )
    );

create policy "Reviewers and Admins can insert score snapshots"
    on score_snapshots for insert
    with check (
        exists (
            select 1 from contracts c
            where c.id = score_snapshots.contract_id
              and c.organization_id = get_current_user_org_id()
        )
    );

-- Storage bucket definition and policy
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;
