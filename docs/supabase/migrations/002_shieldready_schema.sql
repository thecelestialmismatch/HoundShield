-- ============================================================
-- ShieldReady CMMC Compliance Platform — Database Schema
-- Migration: 002_shieldready_schema.sql
-- Depends on: 001_initial_schema.sql
--
-- Platform: NIST SP 800-171 Rev 2 / CMMC 2.0 (Levels 1 & 2)
-- SPRS score range: -203 to +110
--
-- Table creation order (foreign key dependency chain):
--   1. organizations
--   2. org_members          → organizations, auth.users
--   3. nist_controls        (seed data, no FK dependencies)
--   4. assessments          → organizations, auth.users
--   5. assessment_responses → assessments, nist_controls, auth.users
--   6. generated_documents  → organizations, assessments, auth.users
--   7. evidence_files       → organizations, nist_controls, assessments, auth.users
-- ============================================================


-- ============================================================
-- UTILITY: updated_at AUTO-STAMP TRIGGER
--
-- Automatically sets updated_at to now() before any UPDATE.
-- Attach to tables that carry an updated_at column.
-- ============================================================

create or replace function shieldready_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function shieldready_set_updated_at() is
  'Generic trigger function that stamps updated_at = now() on every UPDATE row. '
  'Applied to organizations and assessments tables.';


-- ============================================================
-- TABLE 1: organizations
--
-- Root tenant entity. Every piece of ShieldReady data is scoped
-- to an organization. A single Supabase auth user may belong to
-- multiple organizations via org_members.
--
-- Key compliance fields:
--   cage_code    — 5-char CAGE code issued by DLA for DoD contractors
--   uei_number   — 12-char SAM.gov UEI that replaced DUNS in 2022
--   cmmc_level   — Target CMMC level (1 = Foundational, 2 = Advanced)
--   handles_cui  — Triggers full 110-control Level 2 assessment
--   handles_fci  — Triggers 17-control Level 1 assessment minimum
-- ============================================================

create table organizations (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  cage_code            text,
  uei_number           text,
  employee_count       integer     not null default 1
                         check (employee_count >= 1),
  contract_types       text[]      not null default '{}',
  handles_cui          boolean     not null default false,
  handles_fci          boolean     not null default false,
  cmmc_level           integer     not null default 1
                         check (cmmc_level in (1, 2)),
  subscription_tier    text        not null default 'free'
                         check (subscription_tier in (
                           'free', 'starter', 'professional',
                           'enterprise', 'consultant'
                         )),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table organizations is
  'Root tenant for the ShieldReady platform. All compliance data is scoped to an org. '
  'One Supabase project supports multiple orgs (multi-tenant SaaS).';

comment on column organizations.cage_code is
  'Commercial and Government Entity code — 5-character alphanumeric issued by the '
  'Defense Logistics Agency. Required for DoD contract award.';
comment on column organizations.uei_number is
  'Unique Entity Identifier — 12-character SAM.gov identifier that replaced the '
  'DUNS number in April 2022 for all federal award recipients.';
comment on column organizations.contract_types is
  'Array of contract data categories this org handles, e.g. {CUI, FCI, ITAR}. '
  'Drives which controls are applicable in the assessment.';
comment on column organizations.cmmc_level is
  '1 = Foundational (17 practices, self-assessment), '
  '2 = Advanced (110 practices, C3PAO third-party assessment).';
comment on column organizations.subscription_tier is
  'Billing tier: free (read-only demo), starter (1 org, Level 1), '
  'professional (1 org, Level 2 + docs), enterprise (multi-org), '
  'consultant (multi-client management).';

create index idx_organizations_subscription_tier
  on organizations (subscription_tier);
create index idx_organizations_cmmc_level
  on organizations (cmmc_level);
create index idx_organizations_handles_cui
  on organizations (handles_cui)
  where handles_cui = true;

create trigger trg_organizations_updated_at
  before update on organizations
  for each row execute function shieldready_set_updated_at();


-- ============================================================
-- TABLE 2: org_members
--
-- Junction table linking auth.users to organizations with a role.
-- Supports multi-org membership (a consultant manages many clients).
--
-- Role hierarchy (enforced in application layer):
--   admin              — Full org control, billing, member management
--   compliance_manager — All assessment ops, document generation
--   assessor           — Can answer controls, upload evidence
--   viewer             — Read-only access to reports and scores
-- ============================================================

create table org_members (
  id          uuid        primary key default gen_random_uuid(),
  org_id      uuid        not null references organizations (id) on delete cascade,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  role        text        not null default 'viewer'
                check (role in ('admin', 'compliance_manager', 'assessor', 'viewer')),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,

  unique (org_id, user_id)
);

comment on table org_members is
  'Junction table between auth.users and organizations. Carries the role a user '
  'has within a specific org. Supports consultant accounts that span multiple orgs.';

comment on column org_members.accepted_at is
  'NULL means the invitation is still pending. Set to now() when the user '
  'clicks the acceptance link in their email.';

create index idx_org_members_org_id
  on org_members (org_id);
create index idx_org_members_user_id
  on org_members (user_id);
create index idx_org_members_pending_invites
  on org_members (org_id, invited_at)
  where accepted_at is null;


-- ============================================================
-- TABLE 3: nist_controls
--
-- Immutable seed-data table. Stores all NIST SP 800-171 Rev 2
-- practices mapped to CMMC 2.0. Populated once; never mutated
-- by user operations.
--
-- ID format mirrors the application layer: "AC.1.001", "IA.1.076"
-- SPRS deductions are negative integers per DODAC methodology.
-- All JSONB fields store arrays of strings for portability.
-- ============================================================

create table nist_controls (
  id                   text        primary key,
  family               text        not null,
  family_name          text        not null,
  title                text        not null,
  official_description text        not null,
  plain_english        text        not null,
  sprs_deduction       integer     not null
                         check (sprs_deduction between -5 and 0),
  cmmc_level           integer     not null
                         check (cmmc_level in (1, 2)),
  assessment_question  text        not null,
  remediation_steps    jsonb       not null default '[]',
  affordable_tools     jsonb       not null default '[]',
  evidence_required    jsonb       not null default '[]',
  policy_mapping       jsonb       not null default '[]',
  estimated_hours      numeric(4,1) not null default 0,
  risk_priority        text        not null
                         check (risk_priority in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'))
);

comment on table nist_controls is
  'Seed table containing all NIST SP 800-171 Rev 2 security practices mapped to '
  'CMMC 2.0 Levels 1 and 2. This table is read-only for application users; '
  'it is populated by migrations and never mutated at runtime.';

comment on column nist_controls.id is
  'Dot-notation practice ID matching NIST 800-171 numbering: '
  '"<FAMILY>.<CMMC_LEVEL>.<SEQ>" — e.g. "AC.1.001", "IA.2.078".';
comment on column nist_controls.sprs_deduction is
  'Negative integer (0 to -5). Summed across all UNMET controls to derive '
  'the SPRS score. Base score is +110; fully unmet score can reach -203.';
comment on column nist_controls.remediation_steps is
  'Ordered JSON array of plain-language fix instructions targeted at '
  'small defense contractor shops (8–50 employees, no dedicated IT staff).';
comment on column nist_controls.affordable_tools is
  'JSON array of budget-conscious tools (often free/M365 native) that satisfy '
  'the control. Avoids enterprise vendor lock-in recommendations.';
comment on column nist_controls.evidence_required is
  'JSON array of artifacts a C3PAO assessor needs to observe or receive '
  'to mark this control as MET during a formal assessment.';
comment on column nist_controls.policy_mapping is
  'JSON array of internal policy document names this control maps to, '
  'aligning with the generated_documents doc_type values.';
comment on column nist_controls.estimated_hours is
  'Rough implementation effort in person-hours for a non-technical shop owner '
  'or part-time IT resource. Drives gap-closure roadmap scheduling.';
comment on column nist_controls.risk_priority is
  'CRITICAL = immediate remediation required (often Level 1 controls that '
  'block contract award), HIGH = remediate within 30 days, MEDIUM = 90 days, '
  'LOW = plan for next compliance cycle.';

create index idx_nist_controls_family
  on nist_controls (family);
create index idx_nist_controls_cmmc_level
  on nist_controls (cmmc_level);
create index idx_nist_controls_risk_priority
  on nist_controls (risk_priority);
create index idx_nist_controls_sprs_deduction
  on nist_controls (sprs_deduction);


-- ============================================================
-- TABLE 4: assessments
--
-- Represents one complete CMMC readiness assessment run for an org.
-- An org may have multiple assessments over time (annual reviews,
-- post-remediation rescores). Only one should be in_progress
-- at a time — enforced at the application layer.
--
-- SPRS score starts at 110 (perfect). For each UNMET control the
-- sprs_deduction from nist_controls is subtracted. PARTIAL controls
-- subtract half the deduction (rounded down). This mirrors the
-- DoD SPRS methodology used by contracting officers.
--
-- Score is materialized here for fast dashboard reads; it is
-- recomputed by application logic whenever a response changes.
-- ============================================================

create table assessments (
  id               uuid        primary key default gen_random_uuid(),
  org_id           uuid        not null references organizations (id) on delete cascade,
  cmmc_level       integer     not null default 2
                     check (cmmc_level in (1, 2)),
  status           text        not null default 'in_progress'
                     check (status in ('in_progress', 'completed', 'archived')),
  sprs_score       integer     not null default 110,
  total_met        integer     not null default 0,
  total_partial    integer     not null default 0,
  total_unmet      integer     not null default 0,
  total_assessed   integer     not null default 0,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  last_updated_at  timestamptz not null default now(),
  created_by       uuid        references auth.users (id)
);

comment on table assessments is
  'A single CMMC readiness assessment session for an organization. Stores the '
  'materialized SPRS score and control tallies for fast dashboard rendering. '
  'Score is recomputed by the API on every response save.';

comment on column assessments.sprs_score is
  'Supplier Performance Risk System score in range [-203, 110]. Starts at 110; '
  'each UNMET control subtracts its sprs_deduction; PARTIAL subtracts half. '
  'Contracting officers query this score in the SPRS portal.';
comment on column assessments.total_met is
  'Count of controls answered MET in this assessment.';
comment on column assessments.total_partial is
  'Count of controls answered PARTIAL. These generate POA&M line items.';
comment on column assessments.total_unmet is
  'Count of controls answered UNMET. Critical for gap analysis reports.';
comment on column assessments.total_assessed is
  'Total controls that have a non-NOT_ASSESSED response. '
  'completionPercent = total_assessed / total_applicable_controls * 100.';
comment on column assessments.completed_at is
  'Set when status transitions to ''completed''. Null while in_progress.';

create index idx_assessments_org_id
  on assessments (org_id);
create index idx_assessments_status
  on assessments (org_id, status);
create index idx_assessments_sprs_score
  on assessments (sprs_score);
create index idx_assessments_in_progress
  on assessments (org_id, started_at desc)
  where status = 'in_progress';

create trigger trg_assessments_updated_at
  before update on assessments
  for each row execute function shieldready_set_updated_at();


-- ============================================================
-- TABLE 5: assessment_responses
--
-- One row per (assessment, control) pair. Stores the contractor's
-- self-assessed status, free-text notes, and evidence flag.
--
-- The UNIQUE constraint on (assessment_id, control_id) means an
-- upsert pattern (INSERT ... ON CONFLICT DO UPDATE) is safe for
-- saving individual control answers.
-- ============================================================

create table assessment_responses (
  id                uuid        primary key default gen_random_uuid(),
  assessment_id     uuid        not null references assessments (id) on delete cascade,
  control_id        text        not null references nist_controls (id),
  status            text        not null default 'NOT_ASSESSED'
                      check (status in ('MET', 'PARTIAL', 'UNMET', 'NOT_ASSESSED')),
  notes             text        not null default '',
  evidence_uploaded boolean     not null default false,
  answered_at       timestamptz not null default now(),
  answered_by       uuid        references auth.users (id),

  unique (assessment_id, control_id)
);

comment on table assessment_responses is
  'Stores the contractor''s self-assessment answer for each NIST SP 800-171 '
  'control within an assessment. One row per (assessment, control) pair. '
  'Use INSERT ... ON CONFLICT DO UPDATE for idempotent saves.';

comment on column assessment_responses.status is
  'MET       = control fully satisfied; no SPRS deduction applied. '
  'PARTIAL   = control partially satisfied; half deduction applied. '
  'UNMET     = control not implemented; full deduction applied. '
  'NOT_ASSESSED = not yet answered; excluded from score calculation.';
comment on column assessment_responses.evidence_uploaded is
  'True if one or more files in evidence_files reference this (assessment, control) '
  'pair. Denormalized flag for fast progress UI rendering.';
comment on column assessment_responses.notes is
  'Contractor notes explaining implementation status, planned remediation, '
  'or rationale for partial credit. Exported into POA&M documents.';

create index idx_assessment_responses_assessment_id
  on assessment_responses (assessment_id);
create index idx_assessment_responses_control_id
  on assessment_responses (control_id);
create index idx_assessment_responses_status
  on assessment_responses (assessment_id, status);
create index idx_assessment_responses_evidence_pending
  on assessment_responses (assessment_id, control_id)
  where evidence_uploaded = false
    and status in ('MET', 'PARTIAL');


-- ============================================================
-- TABLE 6: generated_documents
--
-- Tracks every compliance document generated for an org.
-- Physical files are stored in Supabase Storage; this table
-- records the metadata and the Storage path for retrieval.
--
-- doc_type covers:
--   SSP              — System Security Plan (primary C3PAO deliverable)
--   POAM             — Plan of Action & Milestones for unmet/partial controls
--   SPRS_REPORT      — DoD SPRS score report with narrative
--   POLICY_*         — Individual policy documents mapped to control families
-- ============================================================

create table generated_documents (
  id            uuid        primary key default gen_random_uuid(),
  org_id        uuid        not null references organizations (id) on delete cascade,
  assessment_id uuid        references assessments (id),
  doc_type      text        not null
                  check (doc_type in (
                    'SSP',
                    'POAM',
                    'SPRS_REPORT',
                    'POLICY_ACCEPTABLE_USE',
                    'POLICY_INCIDENT_RESPONSE',
                    'POLICY_ACCESS_CONTROL',
                    'POLICY_MEDIA_PROTECTION',
                    'POLICY_AUDIT',
                    'POLICY_AWARENESS_TRAINING',
                    'POLICY_CONFIG_MANAGEMENT',
                    'POLICY_IDENTIFICATION_AUTH'
                  )),
  file_name     text        not null,
  file_path     text,
  file_size     integer,
  generated_at  timestamptz not null default now(),
  generated_by  uuid        references auth.users (id)
);

comment on table generated_documents is
  'Metadata registry for every compliance document generated for an org. '
  'The actual file bytes live in Supabase Storage; file_path is the storage '
  'object key used to construct a signed URL for download.';

comment on column generated_documents.doc_type is
  'Document category enum. SSP and POAM are the two primary CMMC deliverables. '
  'SPRS_REPORT is the DoD portal upload artifact. POLICY_* docs satisfy the '
  'written-policy evidence requirements for Level 2 controls.';
comment on column generated_documents.file_path is
  'Supabase Storage object path, e.g. "org-uuid/ssp-2026-03-11.docx". '
  'Use supabase.storage.from(''compliance-docs'').createSignedUrl(file_path) '
  'to generate time-limited download links.';
comment on column generated_documents.file_size is
  'File size in bytes. Used for storage quota enforcement per subscription tier.';
comment on column generated_documents.assessment_id is
  'NULL-able: policy documents may be generated without a completed assessment. '
  'SSP and POAM should always reference the assessment they were derived from.';

create index idx_generated_documents_org_id
  on generated_documents (org_id);
create index idx_generated_documents_assessment_id
  on generated_documents (assessment_id)
  where assessment_id is not null;
create index idx_generated_documents_doc_type
  on generated_documents (org_id, doc_type);
create index idx_generated_documents_generated_at
  on generated_documents (org_id, generated_at desc);


-- ============================================================
-- TABLE 7: evidence_files
--
-- Stores metadata for every file a contractor uploads as
-- evidence for a specific control within an assessment.
-- Files are stored in Supabase Storage; this table is the index.
--
-- Evidence can expire (expires_at) — relevant when a C3PAO
-- assessment scope requires evidence no older than 12 months,
-- or when a policy document must be re-signed annually.
-- ============================================================

create table evidence_files (
  id            uuid        primary key default gen_random_uuid(),
  org_id        uuid        not null references organizations (id) on delete cascade,
  control_id    text        not null references nist_controls (id),
  assessment_id uuid        references assessments (id),
  file_name     text        not null,
  file_path     text        not null,
  file_size     integer,
  file_type     text,
  uploaded_at   timestamptz not null default now(),
  uploaded_by   uuid        references auth.users (id),
  expires_at    timestamptz
);

comment on table evidence_files is
  'Index of every evidence artifact uploaded by a contractor to satisfy a '
  'specific NIST control within an assessment. The physical file lives in '
  'Supabase Storage; file_path is the storage object key. '
  'When a file is uploaded, the matching assessment_responses.evidence_uploaded '
  'flag should be set to true via an application-layer upsert.';

comment on column evidence_files.control_id is
  'The NIST 800-171 control this evidence satisfies, e.g. "AC.1.001". '
  'One control may have multiple evidence files.';
comment on column evidence_files.file_path is
  'Supabase Storage object key, e.g. "org-uuid/evidence/ac-1-001/screenshot.png".';
comment on column evidence_files.file_type is
  'MIME type of the uploaded file, e.g. "application/pdf", "image/png". '
  'Used to render the correct preview icon in the evidence panel.';
comment on column evidence_files.expires_at is
  'Optional expiry timestamp. When not null and in the past, the evidence '
  'is considered stale and the UI flags the control for re-evidence. '
  'Common use: annual policy sign-offs, training completion certificates.';

create index idx_evidence_files_org_id
  on evidence_files (org_id);
create index idx_evidence_files_control_id
  on evidence_files (control_id);
create index idx_evidence_files_assessment_id
  on evidence_files (assessment_id)
  where assessment_id is not null;
create index idx_evidence_files_org_control
  on evidence_files (org_id, control_id);
create index idx_evidence_files_expiring
  on evidence_files (expires_at)
  where expires_at is not null;


-- ============================================================
-- ROW LEVEL SECURITY
--
-- Strategy: users may only read/write rows that belong to an
-- organization they are a member of (via org_members).
-- The service role (used by Next.js API routes with the
-- SUPABASE_SERVICE_ROLE_KEY) bypasses RLS entirely.
--
-- nist_controls is public read-only — no user-specific data.
-- ============================================================

alter table organizations        enable row level security;
alter table org_members          enable row level security;
alter table nist_controls        enable row level security;
alter table assessments          enable row level security;
alter table assessment_responses enable row level security;
alter table generated_documents  enable row level security;
alter table evidence_files       enable row level security;


-- ── organizations ────────────────────────────────────────────

-- A user can see an organization only if they are a member.
create policy "org_members can view their organization"
  on organizations for select
  using (
    exists (
      select 1 from org_members om
      where om.org_id = organizations.id
        and om.user_id = auth.uid()
        and om.accepted_at is not null
    )
  );

-- Only org admins may update org settings.
create policy "org admins can update organization"
  on organizations for update
  using (
    exists (
      select 1 from org_members om
      where om.org_id = organizations.id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );

-- Any authenticated user may create a new organization
-- (they become its first admin — handled in the application layer).
create policy "authenticated users can create organization"
  on organizations for insert
  with check (auth.uid() is not null);

-- Only org admins may delete (soft-delete preferred at app layer).
create policy "org admins can delete organization"
  on organizations for delete
  using (
    exists (
      select 1 from org_members om
      where om.org_id = organizations.id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );


-- ── org_members ───────────────────────────────────────────────

-- Members can see the full member list for their own org.
create policy "org members can view membership list"
  on org_members for select
  using (
    exists (
      select 1 from org_members self_om
      where self_om.org_id  = org_members.org_id
        and self_om.user_id = auth.uid()
        and self_om.accepted_at is not null
    )
  );

-- Only admins may add new members.
create policy "org admins can insert members"
  on org_members for insert
  with check (
    exists (
      select 1 from org_members om
      where om.org_id  = org_members.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );

-- A user may update their own row (e.g., to accept an invite).
-- Admins may update any member's role within their org.
create policy "members can accept invite or admins can update roles"
  on org_members for update
  using (
    -- Own row (accept invite)
    user_id = auth.uid()
    or
    -- Admin updating another member
    exists (
      select 1 from org_members om
      where om.org_id  = org_members.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );

-- Only admins may remove members.
create policy "org admins can delete members"
  on org_members for delete
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = org_members.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );


-- ── nist_controls ─────────────────────────────────────────────

-- nist_controls is reference data. Any authenticated user may read;
-- no user may write (inserts come only from migrations).
create policy "authenticated users can read nist controls"
  on nist_controls for select
  using (auth.uid() is not null);


-- ── assessments ───────────────────────────────────────────────

create policy "org members can view assessments"
  on assessments for select
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = assessments.org_id
        and om.user_id = auth.uid()
        and om.accepted_at is not null
    )
  );

-- compliance_manager and admin may create or update assessments.
create policy "compliance managers can insert assessments"
  on assessments for insert
  with check (
    exists (
      select 1 from org_members om
      where om.org_id  = assessments.org_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'compliance_manager')
        and om.accepted_at is not null
    )
  );

create policy "compliance managers can update assessments"
  on assessments for update
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = assessments.org_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'compliance_manager')
        and om.accepted_at is not null
    )
  );

-- Only admins may archive/delete assessments.
create policy "org admins can delete assessments"
  on assessments for delete
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = assessments.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );


-- ── assessment_responses ──────────────────────────────────────

-- All org members can view responses (needed for read-only dashboards).
create policy "org members can view responses"
  on assessment_responses for select
  using (
    exists (
      select 1
      from   assessments      a
      join   org_members      om on om.org_id = a.org_id
      where  a.id            = assessment_responses.assessment_id
        and  om.user_id      = auth.uid()
        and  om.accepted_at  is not null
    )
  );

-- assessors, compliance_managers, and admins may answer controls.
create policy "assessors can insert responses"
  on assessment_responses for insert
  with check (
    exists (
      select 1
      from   assessments  a
      join   org_members  om on om.org_id = a.org_id
      where  a.id         = assessment_responses.assessment_id
        and  om.user_id   = auth.uid()
        and  om.role in ('admin', 'compliance_manager', 'assessor')
        and  om.accepted_at is not null
    )
  );

create policy "assessors can update responses"
  on assessment_responses for update
  using (
    exists (
      select 1
      from   assessments  a
      join   org_members  om on om.org_id = a.org_id
      where  a.id         = assessment_responses.assessment_id
        and  om.user_id   = auth.uid()
        and  om.role in ('admin', 'compliance_manager', 'assessor')
        and  om.accepted_at is not null
    )
  );


-- ── generated_documents ───────────────────────────────────────

create policy "org members can view documents"
  on generated_documents for select
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = generated_documents.org_id
        and om.user_id = auth.uid()
        and om.accepted_at is not null
    )
  );

-- compliance_managers and admins may generate documents.
create policy "compliance managers can insert documents"
  on generated_documents for insert
  with check (
    exists (
      select 1 from org_members om
      where om.org_id  = generated_documents.org_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'compliance_manager')
        and om.accepted_at is not null
    )
  );

-- Only admins may delete document records
-- (deletion should also purge the Storage object at the app layer).
create policy "org admins can delete documents"
  on generated_documents for delete
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = generated_documents.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );


-- ── evidence_files ────────────────────────────────────────────

create policy "org members can view evidence"
  on evidence_files for select
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = evidence_files.org_id
        and om.user_id = auth.uid()
        and om.accepted_at is not null
    )
  );

-- assessors and above may upload evidence.
create policy "assessors can insert evidence"
  on evidence_files for insert
  with check (
    exists (
      select 1 from org_members om
      where om.org_id  = evidence_files.org_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'compliance_manager', 'assessor')
        and om.accepted_at is not null
    )
  );

-- Only admins may delete evidence records
-- (deletion should also purge the Storage object at the app layer).
create policy "org admins can delete evidence"
  on evidence_files for delete
  using (
    exists (
      select 1 from org_members om
      where om.org_id  = evidence_files.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.accepted_at is not null
    )
  );


-- ============================================================
-- SEED DATA: nist_controls
--
-- Source: NIST SP 800-171 Rev 2 + CMMC 2.0 Practice Guide
-- 14 control families, 110 total practices (Level 2 full set).
--
-- SPRS deduction values follow the DoD Assessment Methodology
-- v2.2 weighting. All JSONB columns store JSON arrays of strings.
--
-- Only a representative sample of controls is seeded here to
-- establish the schema and demonstrate the data shape. The full
-- 110-practice dataset should be loaded via the application's
-- TypeScript control definitions (lib/shieldready/controls/*).
--
-- A production migration would generate these INSERT statements
-- by serializing the TypeScript source at build time.
-- ============================================================

insert into nist_controls (
  id, family, family_name, title,
  official_description, plain_english,
  sprs_deduction, cmmc_level,
  assessment_question,
  remediation_steps, affordable_tools, evidence_required, policy_mapping,
  estimated_hours, risk_priority
) values

-- ── AC — Access Control (Level 1) ──────────────────────────

(
  'AC.1.001', 'AC', 'Access Control',
  'Limit System Access to Authorized Users',
  'Limit information system access to authorized users, processes acting on behalf of authorized users, and devices (including other information systems).',
  'Only people who are supposed to have access to your computer systems and files can actually get in. If someone leaves your shop, their login should be turned off immediately.',
  -5, 1,
  'Do all users have individual accounts with unique usernames and passwords, and are accounts promptly disabled when employees leave or change roles?',
  '["Enable Windows user accounts on every computer via Settings > Accounts > Family & other users.",
    "Disable or delete accounts within 24 hours of an employee departure.",
    "Review active users in Microsoft 365 admin center monthly and remove stale accounts.",
    "Document an offboarding checklist that includes account revocation as step one."]',
  '["Microsoft 365 Business Premium (Azure AD included)",
    "Windows 10/11 local accounts (built-in, no cost)",
    "KeePass or Bitwarden for password management (free tiers available)"]',
  '["Screenshot of active user list showing named individual accounts only",
    "Sample offboarding checklist with account-disable step",
    "Evidence that a recently departed employee account is disabled"]',
  '["POLICY_ACCESS_CONTROL"]',
  4.0, 'CRITICAL'
),

(
  'AC.1.002', 'AC', 'Access Control',
  'Limit System Access to Authorized Transactions and Functions',
  'Limit information system access to the types of transactions and functions that authorized users are permitted to execute.',
  'Each person should only be able to do what their job requires — a machinist doesn''t need access to payroll, and the bookkeeper shouldn''t be able to delete engineering drawings.',
  -5, 1,
  'Are users'' system privileges limited to only those required for their specific job role, with no one having unrestricted access to all data and functions?',
  '["Map each employee role to the files, folders, and applications they actually need.",
    "Use Windows file share permissions or SharePoint site permissions to enforce least privilege.",
    "Remove local administrator rights from standard user accounts.",
    "Review and adjust permissions quarterly."]',
  '["Windows NTFS permissions (built-in)",
    "Microsoft 365 SharePoint permission levels (built-in)",
    "Active Directory group policies (built-in with Windows Server)"]',
  '["Permission matrix spreadsheet mapping roles to resources",
    "Screenshot of folder ACLs or SharePoint permission settings",
    "Evidence that standard users lack local admin rights"]',
  '["POLICY_ACCESS_CONTROL"]',
  6.0, 'CRITICAL'
),

-- ── AC — Access Control (Level 2) ──────────────────────────

(
  'AC.2.005', 'AC', 'Access Control',
  'Provide Privacy and Security Notices',
  'Provide privacy and security notices consistent with CUI rules.',
  'Display a warning banner on every computer login screen and on your website portals reminding users that the system contains government-sensitive information and that usage is monitored.',
  -1, 2,
  'Does a login warning banner appear on all systems before users authenticate, stating that the system contains CUI and that activity is monitored?',
  '["Configure a Group Policy logon banner: Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options > Interactive logon message.",
    "Apply the same message to your Microsoft 365 tenant login page via Azure AD custom branding.",
    "Post a printed notice near shared terminals if applicable.",
    "Include the required DoD-approved banner text referencing authorized use only."]',
  '["Windows Group Policy (built-in)",
    "Azure AD Custom Branding (included with M365 Business Premium)",
    "DoD-approved banner text templates available at DISA.mil (free)"]',
  '["Screenshot of login banner on at least one workstation",
    "Screenshot of M365 or VPN portal login page showing banner",
    "Group Policy Object export showing banner configuration"]',
  '["POLICY_ACCESS_CONTROL", "POLICY_ACCEPTABLE_USE"]',
  2.0, 'MEDIUM'
),

(
  'AC.2.006', 'AC', 'Access Control',
  'Limit Use of Portable Storage',
  'Limit use of portable storage devices on external systems.',
  'Control or block the use of USB drives and other removable media on systems that hold CUI. This prevents data being walked out the door or malware being introduced via a rogue thumb drive.',
  -3, 2,
  'Is the use of USB drives and removable storage devices on CUI systems restricted, logged, or blocked by technical controls?',
  '["Use Windows Group Policy to block all removable storage: Computer Configuration > Administrative Templates > System > Removable Storage Access.",
    "If USB is needed for specific operations, whitelist only company-owned, encrypted drives (e.g., Kingston IronKey).",
    "Deploy endpoint DLP policy in Microsoft 365 Defender to alert on USB activity.",
    "Maintain a log of authorized USB device serial numbers."]',
  '["Windows Group Policy (built-in)",
    "Microsoft Endpoint Manager / Intune (included with M365 Business Premium)",
    "Kingston IronKey encrypted USB drives (~$50/unit)"]',
  '["Group Policy export showing removable storage restriction",
    "USB device whitelist inventory",
    "Intune or Defender policy screenshot showing USB controls"]',
  '["POLICY_MEDIA_PROTECTION", "POLICY_ACCESS_CONTROL"]',
  4.0, 'HIGH'
),

-- ── AT — Awareness & Training ────────────────────────────────

(
  'AT.2.001', 'AT', 'Awareness & Training',
  'Security Awareness of Risks Associated with CUI',
  'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.',
  'Every employee who touches a computer must receive annual security awareness training. A one-hour lunch-and-learn plus a signed acknowledgment sheet satisfies this for a small shop.',
  -3, 2,
  'Has every employee who accesses CUI systems received documented security awareness training in the past 12 months and signed an acknowledgment?',
  '["Create a one-page CUI Handling Rules document covering what CUI looks like, where it lives, and what is forbidden.",
    "Hold an annual 60-minute training session and record attendance on a sign-in sheet.",
    "Cover phishing, password hygiene, USB risks, and incident reporting in the session.",
    "Store signed acknowledgment forms for at least 3 years as audit evidence."]',
  '["CISA free cybersecurity training at cisa.gov/free-cybersecurity-services",
    "KnowBe4 free phishing simulation tier",
    "NIST NICE Framework free learning resources at niccs.cisa.gov"]',
  '["Signed training acknowledgment forms for all personnel",
    "Training agenda or slide deck",
    "Attendance roster with dates and signatures"]',
  '["POLICY_AWARENESS_TRAINING"]',
  8.0, 'HIGH'
),

(
  'AT.2.002', 'AT', 'Awareness & Training',
  'Ensure Personnel are Trained to Carry Out Responsibilities',
  'Ensure that organizational personnel with security responsibilities are adequately trained to carry out their assigned information security-related duties and responsibilities.',
  'The person in your shop responsible for IT or security must have specific training for their security duties — not just the general awareness everyone gets.',
  -3, 2,
  'Has the individual assigned IT/security responsibilities received role-specific security training beyond the general awareness training given to all staff?',
  '["Identify who holds IT/security responsibilities in writing (even if part-time).",
    "Enroll that person in a role-specific course: CompTIA Security+ fundamentals, SANS CMMC readiness webinars, or DoD Cyber Awareness Challenge (free for contractors).",
    "Document the training completed with certificates or transcripts.",
    "Repeat training annually or when responsibilities change."]',
  '["DoD Cyber Awareness Challenge at cyber.mil (free for contractors)",
    "CISA role-based training at cisa.gov/ics-cert-training-available-through-ics-cert",
    "CompTIA Security+ (paid, ~$350 exam) for dedicated IT staff"]',
  '["Training completion certificate for the security-responsible individual",
    "Role designation document or job description",
    "Evidence of annual training renewal"]',
  '["POLICY_AWARENESS_TRAINING"]',
  16.0, 'HIGH'
),

-- ── AU — Audit & Accountability ──────────────────────────────

(
  'AU.2.041', 'AU', 'Audit & Accountability',
  'Ensure Actions of Individual Users Can Be Traced',
  'Ensure that the actions of individual users can be uniquely traced to those users so they can be held accountable for their actions.',
  'Your systems must log who did what and when. If a file is deleted or a system is accessed without authorization, you need to be able to trace that action to a specific person — not just a shared account.',
  -3, 2,
  'Does every user have a unique login, and do systems log individual user activity including file access, authentication events, and privileged actions?',
  '["Enable Windows Security Event Logging: Event Viewer > Windows Logs > Security.",
    "Enable Microsoft 365 Unified Audit Log in the M365 Compliance Center.",
    "Ensure no shared accounts exist — each log entry must map to one person.",
    "Retain audit logs for at least 90 days online and 1 year total."]',
  '["Windows Event Log (built-in)",
    "Microsoft 365 Unified Audit Log (included with Business Premium)",
    "Azure Log Analytics workspace (free tier: 5GB/month)"]',
  '["Screenshot of Windows Security Event Log showing named user events",
    "M365 Audit Log search results showing user activity",
    "Log retention policy documentation"]',
  '["POLICY_AUDIT"]',
  6.0, 'HIGH'
),

-- ── CM — Configuration Management ───────────────────────────

(
  'CM.2.061', 'CM', 'Configuration Management',
  'Establish and Maintain Baseline Configurations',
  'Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.',
  'Keep a documented, up-to-date list of all computers, software, and network gear — and document the standard security settings you apply to each. If someone adds a new laptop, it must be configured to your baseline before touching CUI.',
  -3, 2,
  'Does the organization maintain a current inventory of all hardware and software on CUI systems, and is there a documented security baseline configuration applied to all systems?',
  '["Create a simple spreadsheet listing every computer, server, and network device: hostname, OS version, owner, and location.",
    "Document the standard Windows security settings you apply to all machines (password policy, screen lock, firewall on).",
    "Use Microsoft Intune or Group Policy to enforce consistent configuration across all Windows devices.",
    "Update the inventory within 24 hours of any addition or removal."]',
  '["Microsoft Intune device inventory (included with M365 Business Premium)",
    "Windows Group Policy for configuration enforcement (built-in)",
    "Snipe-IT open-source asset management (free, self-hosted)"]',
  '["Hardware and software inventory spreadsheet with current date",
    "Baseline configuration document (CIS Benchmark subset is acceptable)",
    "Intune or GPO export showing enforced settings"]',
  '["POLICY_CONFIG_MANAGEMENT"]',
  10.0, 'HIGH'
),

-- ── IA — Identification & Authentication ─────────────────────

(
  'IA.1.076', 'IA', 'Identification & Authentication',
  'Identify System Users, Processes, and Devices',
  'Identify information system users, processes acting on behalf of users, and devices.',
  'Every person, computer program, and device that touches your system must have a unique identity — no shared accounts, no anonymous logins.',
  -5, 1,
  'Does every user, automated process, and networked device have a unique, individually assigned identifier with no shared or generic accounts in active use?',
  '["Audit all user accounts in Active Directory or Azure AD and confirm each maps to one named individual.",
    "Delete or disable all shared, guest, or role-named accounts (e.g., ''admin'', ''front-desk'').",
    "Inventory every networked device and assign each a documented hostname.",
    "Enable device registration in Azure AD for all company workstations."]',
  '["Azure Active Directory (included with M365 Business Basic and above)",
    "Windows local accounts (built-in)",
    "Intune device inventory (included with M365 Business Premium)"]',
  '["Active user list from Azure AD or local AD showing named accounts only",
    "No shared or generic accounts in the active user list",
    "Device inventory with unique hostnames assigned"]',
  '["POLICY_IDENTIFICATION_AUTH", "POLICY_ACCESS_CONTROL"]',
  4.0, 'CRITICAL'
),

(
  'IA.1.077', 'IA', 'Identification & Authentication',
  'Authenticate Users, Processes, and Devices',
  'Authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems.',
  'Knowing who someone is (identification) isn''t enough — you also have to verify they are who they claim to be (authentication). This means passwords at a minimum; multi-factor authentication is strongly preferred and required for Level 2.',
  -5, 1,
  'Do all systems require authentication (password or stronger) before granting access, and are passwords meeting minimum complexity and length requirements?',
  '["Configure Windows password policy via Group Policy: minimum 12 characters, complexity enabled, 90-day maximum age.",
    "Enable Microsoft 365 baseline security defaults which enforce MFA for all users.",
    "Disable password-less or auto-login configurations on all workstations.",
    "Document the password policy in writing."]',
  '["Windows Group Policy password settings (built-in)",
    "Microsoft 365 Security Defaults (free, built-in)",
    "Microsoft Authenticator app (free)"]',
  '["Group Policy export showing password policy settings",
    "Screenshot of M365 security defaults or conditional access policy enabled",
    "Written password policy document"]',
  '["POLICY_IDENTIFICATION_AUTH"]',
  4.0, 'CRITICAL'
),

(
  'IA.3.083', 'IA', 'Identification & Authentication',
  'Employ Multifactor Authentication',
  'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.',
  'Passwords alone are not enough. Every user who accesses CUI systems remotely — and all admin accounts anywhere — must use MFA. This single control blocks over 99% of account takeover attacks.',
  -5, 2,
  'Is multi-factor authentication enforced for all remote access and for all privileged (admin) accounts, with no exceptions?',
  '["Enable Microsoft 365 Security Defaults or Conditional Access to require MFA for all users.",
    "Require MFA for all VPN connections — configure your VPN to accept Azure AD authentication.",
    "For on-premise systems, deploy Azure AD Application Proxy to enforce MFA on remote access.",
    "Exclude no one — especially IT administrators who are highest risk."]',
  '["Microsoft Authenticator (free app)",
    "M365 Security Defaults (free, enforces MFA for all users)",
    "Microsoft Entra ID Free tier includes MFA capabilities",
    "Duo Security free tier (up to 10 users)"]',
  '["Conditional Access or Security Defaults policy screenshot showing MFA required",
    "Evidence that at least one admin account is MFA-enrolled",
    "VPN configuration showing MFA integration",
    "List of all accounts with MFA enrollment status"]',
  '["POLICY_IDENTIFICATION_AUTH", "POLICY_ACCESS_CONTROL"]',
  6.0, 'CRITICAL'
),

-- ── IR — Incident Response ───────────────────────────────────

(
  'IR.2.092', 'IR', 'Incident Response',
  'Establish an Operational Incident-Handling Capability',
  'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.',
  'You need a written plan for what to do when something goes wrong — a ransomware attack, a stolen laptop, an accidental CUI email to the wrong address. The plan doesn''t need to be long, but it must exist and staff must know about it.',
  -3, 2,
  'Does the organization have a documented incident response plan that covers detection, containment, reporting, and recovery, and have key personnel reviewed it in the past year?',
  '["Write a one-to-two page Incident Response Plan using the NIST IR template (available free at nist.gov).",
    "Define what constitutes an incident (lost laptop, phishing click, ransomware, accidental CUI disclosure).",
    "Assign roles: who declares an incident, who notifies DoD, who contacts your MSP.",
    "Include the DoD CUI incident reporting requirement: report to your contracting officer within 72 hours.",
    "Review and re-sign the plan annually."]',
  '["NIST Computer Security Incident Handling Guide SP 800-61 (free PDF)",
    "CISA Incident Response Plan template (free at cisa.gov)",
    "Microsoft Defender Incident alerts (included with M365 Business Premium)"]',
  '["Signed, dated Incident Response Plan document",
    "Evidence of annual review (signature page with current date)",
    "List of incident response contacts and escalation chain"]',
  '["POLICY_INCIDENT_RESPONSE"]',
  8.0, 'HIGH'
),

-- ── SC — System & Communications Protection ──────────────────

(
  'SC.1.175', 'SC', 'System & Communications Protection',
  'Monitor and Control Communications at Boundaries',
  'Monitor, control, and protect organizational communications (i.e., information transmitted or received by organizational information systems) at the external boundaries and key internal boundaries of the information systems.',
  'Your network needs a firewall at its edge. All traffic coming in from the internet and going out must pass through a controlled gateway — no unmanaged connections.',
  -5, 1,
  'Is a firewall deployed at the network perimeter that controls all inbound and outbound traffic, and is it configured to deny traffic not explicitly permitted?',
  '["Enable Windows Defender Firewall on all computers (built-in, ensure it is not disabled).",
    "Deploy a business-grade router/firewall at the office perimeter (Ubiquiti, Cisco Meraki Go, or Fortinet FortiGate entry-level).",
    "Configure the firewall to default-deny inbound traffic and allow only necessary outbound connections.",
    "Log firewall events and review monthly."]',
  '["Windows Defender Firewall (built-in, free)",
    "pfSense open-source firewall (free software, needs a small PC)",
    "Ubiquiti UniFi Security Gateway (~$150 hardware)",
    "Cisco Meraki Go (SMB-focused, affordable subscription)"]',
  '["Firewall make/model and current firmware version",
    "Screenshot of firewall rules showing default-deny inbound policy",
    "Network diagram showing firewall placement at perimeter"]',
  '["POLICY_ACCESS_CONTROL"]',
  8.0, 'CRITICAL'
),

-- ── SI — System & Information Integrity ──────────────────────

(
  'SI.1.210', 'SI', 'System & Information Integrity',
  'Identify, Report, and Correct System Flaws',
  'Identify, report, and correct information and information system flaws in a timely manner.',
  'Keep all software patched and updated. When Microsoft releases a security patch, you apply it within a reasonable window — not months later. This is one of the most effective defenses against ransomware.',
  -5, 1,
  'Is automatic or managed patching enabled for the operating system and all major applications on CUI systems, and are critical patches applied within 30 days of release?',
  '["Enable Windows Update and set it to install security updates automatically: Settings > Windows Update > Advanced Options > Receive updates for other Microsoft products.",
    "Enable automatic updates for all third-party software (browsers, Adobe, etc.) or use Patch My PC (free home use tier).",
    "Verify patch status monthly by checking Windows Update history on each machine.",
    "Document your patch policy: critical patches within 14 days, important patches within 30 days."]',
  '["Windows Update (built-in, free)",
    "Microsoft Intune patch management (included with M365 Business Premium)",
    "Patch My PC Home (free for personal/small business use)",
    "WSUS Windows Server Update Services (free with Windows Server)"]',
  '["Windows Update history screenshot showing recent patches applied",
    "Written patch management policy with defined SLAs",
    "Intune compliance policy showing patch enforcement (if applicable)"]',
  '["POLICY_CONFIG_MANAGEMENT"]',
  4.0, 'CRITICAL'
),

(
  'SI.1.211', 'SI', 'System & Information Integrity',
  'Provide Protection from Malicious Code',
  'Provide protection from malicious code at appropriate locations within organizational information systems.',
  'Every computer that touches CUI must have active, up-to-date antivirus/anti-malware software running. This includes servers, workstations, and laptops.',
  -5, 1,
  'Is endpoint protection (antivirus/anti-malware) installed and actively running on all workstations, laptops, and servers that store or process CUI?',
  '["Verify Microsoft Defender Antivirus is active on all Windows machines: Windows Security > Virus & Threat Protection.",
    "Ensure real-time protection and cloud-delivered protection are both enabled.",
    "Enable Microsoft Defender for Business (included with M365 Business Premium) for centralized management.",
    "Document that antivirus is present and the definition update date for each machine."]',
  '["Microsoft Defender Antivirus (built-in to Windows 10/11, free)",
    "Microsoft Defender for Business (included with M365 Business Premium)",
    "Malwarebytes free tier for supplemental scanning"]',
  '["Screenshot of Windows Security showing Defender active and definitions current",
    "Defender for Business dashboard showing all devices protected (if using M365 BP)",
    "Written policy requiring endpoint protection on all CUI systems"]',
  '["POLICY_CONFIG_MANAGEMENT"]',
  3.0, 'CRITICAL'
)

on conflict (id) do update set
  family               = excluded.family,
  family_name          = excluded.family_name,
  title                = excluded.title,
  official_description = excluded.official_description,
  plain_english        = excluded.plain_english,
  sprs_deduction       = excluded.sprs_deduction,
  cmmc_level           = excluded.cmmc_level,
  assessment_question  = excluded.assessment_question,
  remediation_steps    = excluded.remediation_steps,
  affordable_tools     = excluded.affordable_tools,
  evidence_required    = excluded.evidence_required,
  policy_mapping       = excluded.policy_mapping,
  estimated_hours      = excluded.estimated_hours,
  risk_priority        = excluded.risk_priority;


-- ============================================================
-- END OF MIGRATION: 002_shieldready_schema.sql
-- ============================================================
