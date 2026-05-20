-- Recrix seed data
-- Rich mock dataset for development and testing.
-- Run against a database with schema.sql already applied.

-- ============================================================================
-- Users: 2 recruiters + 4 candidates
-- Password for all: see comment after each entry
-- ============================================================================
insert into public.users (id, email, password_hash, role) values
  (
    '00000000-0000-0000-0000-000000000001',
    'sarah.chen@recrix.dev',
    crypt('recruiter123', gen_salt('bf', 12)),
    'recruiter'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'marcus.wells@recrix.dev',
    crypt('recruiter123', gen_salt('bf', 12)),
    'recruiter'
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    'alex.rivera@candidate.dev',
    crypt('candidate123', gen_salt('bf', 12)),
    'candidate'
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'priya.sharma@candidate.dev',
    crypt('candidate123', gen_salt('bf', 12)),
    'candidate'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'james.oconnor@candidate.dev',
    crypt('candidate123', gen_salt('bf', 12)),
    'candidate'
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    'yuki.tanaka@candidate.dev',
    crypt('candidate123', gen_salt('bf', 12)),
    'candidate'
  )
on conflict do nothing;

-- ============================================================================
-- Jobs: 8 listings across Engineering, Design, Data, Marketing, Product
-- ============================================================================
insert into public.jobs (
  id, recruiter_id, title, department, location,
  employment_type, required_skills, preferred_skills,
  experience_level, description, status
) values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Senior Frontend Engineer',
    'Engineering',
    'San Francisco, CA',
    'Full-time',
    array['React', 'TypeScript', 'Next.js', 'CSS', 'Git'],
    array['Tailwind CSS', 'Framer Motion', 'Testing Library'],
    'Senior',
    'Build and maintain our React-based customer dashboard. You will work closely with design and product teams to deliver polished, accessible UI components. Experience with Next.js and TypeScript is strongly preferred.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Backend Engineer',
    'Engineering',
    'Remote',
    'Full-time',
    array['Node.js', 'PostgreSQL', 'REST APIs', 'Docker'],
    array['Redis', 'Kubernetes', 'GraphQL'],
    'Mid-level',
    'Design and implement RESTful APIs and microservices. Ownership of database schema design, query optimization, and CI/CD pipelines. Must be comfortable with PostgreSQL and Node.js.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Product Designer',
    'Design',
    'New York, NY',
    'Full-time',
    array['Figma', 'UI Design', 'Prototyping', 'Design Systems'],
    array['Framer', 'Motion Design', 'User Research'],
    'Mid-level',
    'Own the end-to-end design process for our B2B SaaS product. Create wireframes, high-fidelity mockups, and interactive prototypes. Collaborate with engineers to deliver pixel-perfect implementations.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'Data Scientist',
    'Data',
    'Remote',
    'Full-time',
    array['Python', 'Machine Learning', 'SQL', 'Statistics'],
    array['PyTorch', 'NLP', 'Spark', 'Airflow'],
    'Senior',
    'Develop ML models for candidate-job matching and build analytics dashboards. Strong statistical background required. Experience with NLP and recommendation systems is a plus.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'Growth Marketing Manager',
    'Marketing',
    'Austin, TX',
    'Full-time',
    array['SEO', 'Google Ads', 'Analytics', 'Content Strategy'],
    array['HubSpot', 'A/B Testing', 'Copywriting'],
    'Mid-level',
    'Drive user acquisition and retention through paid channels, SEO, and content marketing. Own the full marketing funnel and report on KPIs weekly.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'DevOps Engineer',
    'Engineering',
    'Remote',
    'Contract',
    array['AWS', 'Terraform', 'CI/CD', 'Linux', 'Docker'],
    array['Kubernetes', 'Datadog', 'Ansible'],
    'Senior',
    'Manage cloud infrastructure on AWS. Set up monitoring, alerting, and automated deployment pipelines. Ensure 99.9% uptime SLA.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000002',
    'Product Manager',
    'Product',
    'San Francisco, CA',
    'Full-time',
    array['Product Strategy', 'Agile', 'Data Analysis', 'Roadmapping'],
    array['SQL', 'Jira', 'User Interviews'],
    'Senior',
    'Own the product roadmap for our AI recruitment features. Work cross-functionally with engineering, design, and sales to prioritize features and deliver measurable business outcomes.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'Junior UX Researcher',
    'Design',
    'New York, NY',
    'Part-time',
    array['User Research', 'Surveys', 'Usability Testing'],
    array['Dovetail', 'Miro', 'Qualitative Analysis'],
    'Entry',
    'Support the design team with usability testing, user interviews, and survey design. Help synthesize research findings into actionable product recommendations.',
    'draft'
  )
on conflict do nothing;

-- ============================================================================
-- Applications: 12 applications with varied statuses and scores
-- ============================================================================
insert into public.applications (
  id, job_id, candidate_id, status, match_score,
  risk_evaluation, invited_at, parsed_resume
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'interview_scheduled',
    87,
    'Strong frontend experience with React and TypeScript. 4+ years of relevant experience at SaaS companies. Minor gap: no production Next.js App Router experience, though framework knowledge is evident.',
    now() - interval '2 days',
    '{
      "parsed": {
        "name": "Alex Rivera",
        "email": "alex.rivera@candidate.dev",
        "skills": ["React", "TypeScript", "JavaScript", "CSS", "Git", "Tailwind CSS", "Jest"],
        "technical_skills": ["React", "TypeScript", "Next.js", "JavaScript", "CSS", "Tailwind CSS"],
        "soft_skills": ["Team collaboration", "Mentoring"],
        "tools": ["VS Code", "GitHub", "Figma"],
        "work_experience": [
          {
            "company": "TechCorp",
            "title": "Frontend Engineer",
            "duration": "2021–Present",
            "description": "Built React component libraries and implemented design system.",
            "achievements": ["Reduced bundle size by 40%", "Led migration to TypeScript"],
            "technologies_used": ["React", "TypeScript", "Webpack"]
          },
          {
            "company": "StartupXYZ",
            "title": "Junior Developer",
            "duration": "2019–2021",
            "description": "Full-stack development with React and Node.js.",
            "achievements": ["Shipped 3 customer-facing features"],
            "technologies_used": ["React", "Node.js", "MongoDB"]
          }
        ],
        "education": [{"institution": "UC Berkeley", "degree": "B.S.", "field": "Computer Science", "year": "2019"}],
        "certifications": [],
        "total_years_experience": 5
      },
      "scoring": {
        "skillMatch": {
          "matched": ["React", "TypeScript", "CSS", "Git"],
          "missing": ["Next.js"],
          "bonus": ["Tailwind CSS", "Jest"]
        },
        "strengths": [
          "Strong React expertise with production component library experience",
          "TypeScript migration leadership shows initiative",
          "Performance optimization skills (40% bundle reduction)"
        ],
        "concerns": [
          "Limited Next.js App Router experience",
          "No accessibility-specific experience mentioned"
        ],
        "experienceFit": "Good fit. 5 years of frontend experience aligns well with the Senior level requirement.",
        "recommendation": "yes"
      }
    }'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000011',
    'submitted',
    72,
    'Solid Node.js experience. Has worked with PostgreSQL but limited production exposure. Docker experience is primarily local development. Could be a strong mid-level hire with mentoring.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000012',
    'reviewed',
    91,
    'Exceptional design portfolio. 6 years in B2B SaaS. Built and maintained design systems at scale. Figma expert. Only concern: no management experience if role evolves.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000013',
    'submitted',
    65,
    'Strong statistical background. Python and SQL are solid. Limited ML deployment experience — most projects are academic. NLP experience is theoretical only.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'rejected',
    38,
    'Backend-focused candidate. Minimal frontend experience. React knowledge is limited to tutorials. Not a fit for a senior frontend role.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000010',
    'submitted',
    45,
    'Engineering background with no marketing experience. Shows interest but lacks practical campaign management skills. High risk for this role.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000013',
    'manual_review',
    null,
    'Score unavailable.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000012',
    'interview_scheduled',
    82,
    'Design background gives strong user empathy. Has worked as a product lead informally. Formal PM methodology experience is limited but trainable. Good cultural fit.',
    now() - interval '1 day',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000013',
    'reviewed',
    78,
    'Python-first developer transitioning to Node.js. PostgreSQL is strong. Docker experience is solid. Good candidate with some ramp-up needed on the Node.js ecosystem.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000013',
    'submitted',
    55,
    'Data science background provides analytical thinking. Some React knowledge from personal projects. TypeScript experience is minimal. Underqualified for senior frontend role but shows potential.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000010',
    'submitted',
    42,
    'Frontend engineer applying for data science. Python knowledge is basic. No ML or statistics background. Not recommended for this role.',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000010',
    'submitted',
    35,
    'Engineering background with no formal design training. Portfolio shows basic UI work only. Figma experience is limited to viewing. Not a fit for this role.',
    null,
    null
  )
on conflict do nothing;

-- ============================================================================
-- Interview Sessions: 4 sessions with realistic Q&A data
-- ============================================================================
insert into public.interview_sessions (
  id, application_id, questions, answers, summary, status
) values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '["Describe your experience building and maintaining a React component library. What patterns did you follow for API consistency?", "Tell me about a time you had to optimize frontend performance. What was the bottleneck and how did you address it?", "How would you approach migrating a large codebase from JavaScript to TypeScript incrementally?", "Describe a situation where you disagreed with a designer about a UI implementation. How did you resolve it?", "If you needed to implement real-time collaborative editing in a React app, what architecture would you propose?"]'::jsonb,
    '[
      {
        "questionIndex": 0,
        "question": "Describe your experience building and maintaining a React component library.",
        "answer": "At TechCorp, I led the creation of our internal component library serving 12 product teams. We used a compound component pattern with TypeScript generics for type safety. Each component had Storybook documentation and visual regression tests.",
        "feedback": "Excellent answer. Specific details about compound patterns and Storybook show depth. Consider mentioning versioning strategy and how you handled breaking changes across teams."
      },
      {
        "questionIndex": 1,
        "question": "Tell me about a time you optimized frontend performance.",
        "answer": "I identified our bundle was 2.8MB. Used webpack-bundle-analyzer to find duplicate dependencies. Implemented code splitting with React.lazy and dynamic imports, reducing initial load by 40%.",
        "feedback": "Strong technical answer with specific metrics. Good use of the STAR method. Could improve by mentioning measurement tools (Lighthouse, Web Vitals) and the business impact of the improvement."
      },
      {
        "questionIndex": 2,
        "question": "How would you approach migrating a large codebase from JavaScript to TypeScript?",
        "answer": "Start with tsconfig set to strict: false and allowJs: true. Migrate leaf files first (utilities, types), then work inward to components. Gradually enable strict checks. Use automated codemods where possible.",
        "feedback": "Practical and realistic approach. Shows experience with real-world constraints. Consider mentioning team coordination — how would you track progress and ensure consistency?"
      },
      {
        "questionIndex": 3,
        "question": "How did you resolve a disagreement with a designer?",
        "answer": "A designer wanted a complex animation that caused jank on mobile. I built a prototype showing the performance issue, proposed an alternative using CSS transforms, and we iterated together to find a solution that was both beautiful and performant.",
        "feedback": "Good collaborative approach. Demonstrates technical communication skills. The prototype idea is particularly strong — it shows rather than tells."
      }
    ]'::jsonb,
    'Strong candidate with excellent frontend fundamentals.',
    'completed'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000008',
    '["How do you prioritize features when stakeholders have conflicting requirements?", "Describe your approach to writing a Product Requirements Document.", "Tell me about a product launch that didn''t go as planned. What happened and what did you learn?", "How would you measure the success of our AI matching feature?", "Walk me through how you would conduct a user interview for a new feature."]'::jsonb,
    '[
      {
        "questionIndex": 0,
        "question": "How do you prioritize features with conflicting requirements?",
        "answer": "I use a weighted scoring framework considering impact, effort, and strategic alignment. I present data-backed trade-offs to stakeholders and facilitate alignment sessions.",
        "feedback": "Good structured approach. Could be stronger with a specific example. Consider mentioning how you handle emotional stakeholders or executive override situations."
      }
    ]'::jsonb,
    null,
    'in_progress'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '["How do you ensure accessibility in a React application?", "Describe your approach to state management in a large React application.", "What testing strategies do you use for UI components?", "How would you implement a design token system that supports theming?", "Tell me about a time you mentored a junior developer."]'::jsonb,
    '[]'::jsonb,
    null,
    'in_progress'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000003',
    '["Walk me through your design process for a complex B2B feature.", "How do you balance user needs with business goals in your designs?", "Describe a time you used research findings to change a product direction."]'::jsonb,
    '[
      {
        "questionIndex": 0,
        "question": "Walk me through your design process.",
        "answer": "I start with stakeholder interviews and competitive analysis, then create user journey maps. I iterate through low-fi wireframes to hi-fi prototypes with user testing at each stage.",
        "feedback": "Comprehensive process description. Shows end-to-end ownership. Consider mentioning specific tools and how you document design decisions for engineering handoff."
      },
      {
        "questionIndex": 1,
        "question": "How do you balance user needs with business goals?",
        "answer": "I map user pain points to business metrics. For example, reducing onboarding friction (user need) directly improves activation rate (business goal). I present these connections to stakeholders.",
        "feedback": "Excellent framing. Connecting user needs to business outcomes shows product thinking. Very strong answer."
      }
    ]'::jsonb,
    'Strong design thinking with good business acumen.',
    'completed'
  )
on conflict do nothing;

-- ============================================================================
-- Saved Jobs: A few bookmarked jobs for candidates
-- ============================================================================
insert into public.saved_jobs (candidate_id, job_id) values
  ('00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003')
on conflict do nothing;
