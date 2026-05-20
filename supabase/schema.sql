create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  role text not null check (role in ('recruiter', 'candidate')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.users
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists users_email_unique
  on public.users (lower(email));

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  department text not null,
  location text not null,
  employment_type text not null,
  required_skills text[] not null,
  preferred_skills text[] null,
  experience_level text not null,
  description text not null,
  status text not null check (status in ('draft', 'active', 'closed')) default 'active',
  created_at timestamptz not null default now()
);

create index if not exists jobs_recruiter_id_idx
  on public.jobs (recruiter_id);

create index if not exists jobs_status_idx
  on public.jobs (status);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.users(id) on delete cascade,
  resume_path text,
  parsed_resume jsonb,
  match_score int check (match_score between 0 and 100),
  risk_evaluation text,
  status text not null check (
    status in (
      'submitted',
      'manual_review',
      'reviewed',
      'interview_scheduled',
      'rejected'
    )
  ) default 'submitted',
  invited_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists applications_unique_candidate_job
  on public.applications (candidate_id, job_id);

create index if not exists applications_job_id_idx
  on public.applications (job_id);

create index if not exists applications_candidate_id_idx
  on public.applications (candidate_id);

create index if not exists applications_status_idx
  on public.applications (status);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  questions jsonb,
  answers jsonb,
  summary text,
  status text not null check (status in ('in_progress', 'completed'))
    default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_sessions_application_id_idx
  on public.interview_sessions (application_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_interview_sessions_updated_at on public.interview_sessions;
create trigger set_interview_sessions_updated_at
  before update on public.interview_sessions
  for each row
  execute function public.set_updated_at();

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists saved_jobs_unique_candidate_job
  on public.saved_jobs (candidate_id, job_id);

create index if not exists saved_jobs_candidate_id_idx
  on public.saved_jobs (candidate_id);

create table if not exists public.application_evaluations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  model text not null,
  prompt_version text not null,
  evaluation_version text not null,
  overall_match_score int not null check (overall_match_score between 0 and 100),
  skills_match_score int not null check (skills_match_score between 0 and 100),
  experience_match_score int not null check (experience_match_score between 0 and 100),
  education_match_score int not null check (education_match_score between 0 and 100),
  hiring_recommendation text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists application_evaluations_application_id_idx
  on public.application_evaluations (application_id, created_at desc);
