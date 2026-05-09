insert into public.users (id, email, password_hash, role)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'recruiter@recrix.dev',
    crypt('Password123!', gen_salt('bf', 12)),
    'recruiter'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'candidate@recrix.dev',
    crypt('Password123!', gen_salt('bf', 12)),
    'candidate'
  )
on conflict do nothing;

insert into public.jobs (
  id,
  recruiter_id,
  title,
  department,
  location,
  employment_type,
  required_skills,
  preferred_skills,
  experience_level,
  description,
  status
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Senior UX Designer',
    'Design',
    'Remote',
    'Full-time',
    array['Figma', 'Design systems', 'UX research'],
    array['Motion design', 'Accessibility'],
    'Senior',
    'Own end-to-end UX for core recruiter workflows and partner with product to ship consistently.',
    'active'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Full Stack Engineer',
    'Engineering',
    'Hybrid - London',
    'Full-time',
    array['TypeScript', 'Next.js', 'PostgreSQL'],
    array['Supabase', 'AI tooling'],
    'Mid',
    'Build and ship new recruiter tools with a focus on performance and reliability.',
    'active'
  )
on conflict do nothing;

insert into public.applications (
  id,
  job_id,
  candidate_id,
  resume_path,
  match_score,
  risk_evaluation,
  status
)
values
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'resumes/seed-candidate.pdf',
    82,
    'Strong UX experience; limited exposure to motion design but core requirements are met.',
    'reviewed'
  )
on conflict do nothing;

insert into public.interview_sessions (
  id,
  application_id,
  questions,
  answers,
  summary,
  status
)
values
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '["Walk through a recent design system decision.", "How do you validate usability improvements?"]'::jsonb,
    '[]'::jsonb,
    null,
    'in_progress'
  )
on conflict do nothing;
