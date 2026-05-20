/**
 * Rich mock data for development and testing.
 * Used by both the TS seed script and SQL seed.
 */

export const MOCK_USERS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "sarah.chen@recrix.dev",
    password: "recruiter123",
    role: "recruiter" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "marcus.wells@recrix.dev",
    password: "recruiter123",
    role: "recruiter" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000010",
    email: "alex.rivera@candidate.dev",
    password: "candidate123",
    role: "candidate" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    email: "priya.sharma@candidate.dev",
    password: "candidate123",
    role: "candidate" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000012",
    email: "james.oconnor@candidate.dev",
    password: "candidate123",
    role: "candidate" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000013",
    email: "yuki.tanaka@candidate.dev",
    password: "candidate123",
    role: "candidate" as const,
  },
];

export const MOCK_JOBS = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    recruiter_id: "00000000-0000-0000-0000-000000000001",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "San Francisco, CA",
    employment_type: "Full-time",
    experience_level: "Senior",
    description:
      "Build and maintain our React-based customer dashboard. You will work closely with design and product teams to deliver polished, accessible UI components. Experience with Next.js and TypeScript is strongly preferred.",
    required_skills: ["React", "TypeScript", "Next.js", "CSS", "Git"],
    preferred_skills: ["Tailwind CSS", "Framer Motion", "Testing Library"],
    status: "active" as const,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    recruiter_id: "00000000-0000-0000-0000-000000000001",
    title: "Backend Engineer",
    department: "Engineering",
    location: "Remote",
    employment_type: "Full-time",
    experience_level: "Mid-level",
    description:
      "Design and implement RESTful APIs and microservices. Ownership of database schema design, query optimization, and CI/CD pipelines. Must be comfortable with PostgreSQL and Node.js.",
    required_skills: ["Node.js", "PostgreSQL", "REST APIs", "Docker"],
    preferred_skills: ["Redis", "Kubernetes", "GraphQL"],
    status: "active" as const,
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    recruiter_id: "00000000-0000-0000-0000-000000000001",
    title: "Product Designer",
    department: "Design",
    location: "New York, NY",
    employment_type: "Full-time",
    experience_level: "Mid-level",
    description:
      "Own the end-to-end design process for our B2B SaaS product. Create wireframes, high-fidelity mockups, and interactive prototypes. Collaborate with engineers to deliver pixel-perfect implementations.",
    required_skills: ["Figma", "UI Design", "Prototyping", "Design Systems"],
    preferred_skills: ["Framer", "Motion Design", "User Research"],
    status: "active" as const,
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    recruiter_id: "00000000-0000-0000-0000-000000000002",
    title: "Data Scientist",
    department: "Data",
    location: "Remote",
    employment_type: "Full-time",
    experience_level: "Senior",
    description:
      "Develop ML models for candidate-job matching and build analytics dashboards. Strong statistical background required. Experience with NLP and recommendation systems is a plus.",
    required_skills: ["Python", "Machine Learning", "SQL", "Statistics"],
    preferred_skills: ["PyTorch", "NLP", "Spark", "Airflow"],
    status: "active" as const,
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    recruiter_id: "00000000-0000-0000-0000-000000000002",
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Austin, TX",
    employment_type: "Full-time",
    experience_level: "Mid-level",
    description:
      "Drive user acquisition and retention through paid channels, SEO, and content marketing. Own the full marketing funnel and report on KPIs weekly.",
    required_skills: ["SEO", "Google Ads", "Analytics", "Content Strategy"],
    preferred_skills: ["HubSpot", "A/B Testing", "Copywriting"],
    status: "active" as const,
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    recruiter_id: "00000000-0000-0000-0000-000000000001",
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    employment_type: "Contract",
    experience_level: "Senior",
    description:
      "Manage cloud infrastructure on AWS. Set up monitoring, alerting, and automated deployment pipelines. Ensure 99.9% uptime SLA.",
    required_skills: ["AWS", "Terraform", "CI/CD", "Linux", "Docker"],
    preferred_skills: ["Kubernetes", "Datadog", "Ansible"],
    status: "active" as const,
  },
  {
    id: "10000000-0000-0000-0000-000000000007",
    recruiter_id: "00000000-0000-0000-0000-000000000002",
    title: "Product Manager",
    department: "Product",
    location: "San Francisco, CA",
    employment_type: "Full-time",
    experience_level: "Senior",
    description:
      "Own the product roadmap for our AI recruitment features. Work cross-functionally with engineering, design, and sales to prioritize features and deliver measurable business outcomes.",
    required_skills: [
      "Product Strategy",
      "Agile",
      "Data Analysis",
      "Roadmapping",
    ],
    preferred_skills: ["SQL", "Jira", "User Interviews"],
    status: "active" as const,
  },
  {
    id: "10000000-0000-0000-0000-000000000008",
    recruiter_id: "00000000-0000-0000-0000-000000000001",
    title: "Junior UX Researcher",
    department: "Design",
    location: "New York, NY",
    employment_type: "Part-time",
    experience_level: "Entry",
    description:
      "Support the design team with usability testing, user interviews, and survey design. Help synthesize research findings into actionable product recommendations.",
    required_skills: ["User Research", "Surveys", "Usability Testing"],
    preferred_skills: ["Dovetail", "Miro", "Qualitative Analysis"],
    status: "draft" as const,
  },
];

export const MOCK_APPLICATIONS = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    job_id: "10000000-0000-0000-0000-000000000001",
    candidate_id: "00000000-0000-0000-0000-000000000010",
    status: "interview_scheduled" as const,
    match_score: 87,
    risk_evaluation:
      "Strong frontend experience with React and TypeScript. 4+ years of relevant experience at SaaS companies. Minor gap: no production Next.js App Router experience, though framework knowledge is evident.",
    invited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    parsed_resume: {
      parsed: {
        name: "Alex Rivera",
        email: "alex.rivera@candidate.dev",
        skills: ["React", "TypeScript", "JavaScript", "CSS", "Git", "Tailwind CSS", "Jest"],
        technical_skills: ["React", "TypeScript", "Next.js", "JavaScript", "CSS", "Tailwind CSS"],
        soft_skills: ["Team collaboration", "Mentoring"],
        tools: ["VS Code", "GitHub", "Figma"],
        work_experience: [
          {
            company: "TechCorp",
            title: "Frontend Engineer",
            duration: "2021–Present",
            description: "Built React component libraries and implemented design system.",
            achievements: ["Reduced bundle size by 40%", "Led migration to TypeScript"],
            technologies_used: ["React", "TypeScript", "Webpack"],
          },
          {
            company: "StartupXYZ",
            title: "Junior Developer",
            duration: "2019–2021",
            description: "Full-stack development with React and Node.js.",
            achievements: ["Shipped 3 customer-facing features"],
            technologies_used: ["React", "Node.js", "MongoDB"],
          },
        ],
        education: [{ institution: "UC Berkeley", degree: "B.S.", field: "Computer Science", year: "2019" }],
        certifications: [],
        total_years_experience: 5,
      },
      scoring: {
        skillMatch: {
          matched: ["React", "TypeScript", "CSS", "Git"],
          missing: ["Next.js"],
          bonus: ["Tailwind CSS", "Jest"],
        },
        strengths: [
          "Strong React expertise with production component library experience",
          "TypeScript migration leadership shows initiative",
          "Performance optimization skills (40% bundle reduction)",
        ],
        concerns: [
          "Limited Next.js App Router experience",
          "No accessibility-specific experience mentioned",
        ],
        experienceFit: "Good fit. 5 years of frontend experience aligns well with the Senior level requirement.",
        recommendation: "yes",
      },
    },
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    job_id: "10000000-0000-0000-0000-000000000002",
    candidate_id: "00000000-0000-0000-0000-000000000011",
    status: "submitted" as const,
    match_score: 72,
    risk_evaluation:
      "Solid Node.js experience. Has worked with PostgreSQL but limited production exposure. Docker experience is primarily local development. Could be a strong mid-level hire with mentoring.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    job_id: "10000000-0000-0000-0000-000000000003",
    candidate_id: "00000000-0000-0000-0000-000000000012",
    status: "reviewed" as const,
    match_score: 91,
    risk_evaluation:
      "Exceptional design portfolio. 6 years in B2B SaaS. Built and maintained design systems at scale. Figma expert. Only concern: no management experience if role evolves.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    job_id: "10000000-0000-0000-0000-000000000004",
    candidate_id: "00000000-0000-0000-0000-000000000013",
    status: "submitted" as const,
    match_score: 65,
    risk_evaluation:
      "Strong statistical background. Python and SQL are solid. Limited ML deployment experience — most projects are academic. NLP experience is theoretical only.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000005",
    job_id: "10000000-0000-0000-0000-000000000001",
    candidate_id: "00000000-0000-0000-0000-000000000011",
    status: "rejected" as const,
    match_score: 38,
    risk_evaluation:
      "Backend-focused candidate. Minimal frontend experience. React knowledge is limited to tutorials. Not a fit for a senior frontend role.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000006",
    job_id: "10000000-0000-0000-0000-000000000005",
    candidate_id: "00000000-0000-0000-0000-000000000010",
    status: "submitted" as const,
    match_score: 45,
    risk_evaluation:
      "Engineering background with no marketing experience. Shows interest but lacks practical campaign management skills. High risk for this role.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000007",
    job_id: "10000000-0000-0000-0000-000000000006",
    candidate_id: "00000000-0000-0000-0000-000000000013",
    status: "manual_review" as const,
    match_score: null,
    risk_evaluation: "Score unavailable.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000008",
    job_id: "10000000-0000-0000-0000-000000000007",
    candidate_id: "00000000-0000-0000-0000-000000000012",
    status: "interview_scheduled" as const,
    match_score: 82,
    risk_evaluation:
      "Design background gives strong user empathy. Has worked as a product lead informally. Formal PM methodology experience is limited but trainable. Good cultural fit.",
    invited_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000009",
    job_id: "10000000-0000-0000-0000-000000000002",
    candidate_id: "00000000-0000-0000-0000-000000000013",
    status: "reviewed" as const,
    match_score: 78,
    risk_evaluation:
      "Python-first developer transitioning to Node.js. PostgreSQL is strong. Docker experience is solid. Good candidate with some ramp-up needed on the Node.js ecosystem.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000010",
    job_id: "10000000-0000-0000-0000-000000000001",
    candidate_id: "00000000-0000-0000-0000-000000000013",
    status: "submitted" as const,
    match_score: 55,
    risk_evaluation:
      "Data science background provides analytical thinking. Some React knowledge from personal projects. TypeScript experience is minimal. Underqualified for senior frontend role but shows potential.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000011",
    job_id: "10000000-0000-0000-0000-000000000004",
    candidate_id: "00000000-0000-0000-0000-000000000010",
    status: "submitted" as const,
    match_score: 42,
    risk_evaluation:
      "Frontend engineer applying for data science. Python knowledge is basic. No ML or statistics background. Not recommended for this role.",
    invited_at: null,
    parsed_resume: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000012",
    job_id: "10000000-0000-0000-0000-000000000003",
    candidate_id: "00000000-0000-0000-0000-000000000010",
    status: "submitted" as const,
    match_score: 35,
    risk_evaluation:
      "Engineering background with no formal design training. Portfolio shows basic UI work only. Figma experience is limited to viewing. Not a fit for this role.",
    invited_at: null,
    parsed_resume: null,
  },
];

export const MOCK_INTERVIEW_SESSIONS = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    application_id: "20000000-0000-0000-0000-000000000001",
    status: "completed" as const,
    questions: [
      "Describe your experience building and maintaining a React component library. What patterns did you follow for API consistency?",
      "Tell me about a time you had to optimize frontend performance. What was the bottleneck and how did you address it?",
      "How would you approach migrating a large codebase from JavaScript to TypeScript incrementally?",
      "Describe a situation where you disagreed with a designer about a UI implementation. How did you resolve it?",
      "If you needed to implement real-time collaborative editing in a React app, what architecture would you propose?",
    ],
    answers: [
      {
        questionIndex: 0,
        question:
          "Describe your experience building and maintaining a React component library.",
        answer:
          "At TechCorp, I led the creation of our internal component library serving 12 product teams. We used a compound component pattern with TypeScript generics for type safety. Each component had Storybook documentation and visual regression tests.",
        feedback:
          "Excellent answer. Specific details about compound patterns and Storybook show depth. Consider mentioning versioning strategy and how you handled breaking changes across teams.",
      },
      {
        questionIndex: 1,
        question: "Tell me about a time you optimized frontend performance.",
        answer:
          "I identified our bundle was 2.8MB. Used webpack-bundle-analyzer to find duplicate dependencies. Implemented code splitting with React.lazy and dynamic imports, reducing initial load by 40%.",
        feedback:
          "Strong technical answer with specific metrics. Good use of the STAR method. Could improve by mentioning measurement tools (Lighthouse, Web Vitals) and the business impact of the improvement.",
      },
      {
        questionIndex: 2,
        question:
          "How would you approach migrating a large codebase from JavaScript to TypeScript?",
        answer:
          "Start with tsconfig set to strict: false and allowJs: true. Migrate leaf files first (utilities, types), then work inward to components. Gradually enable strict checks. Use automated codemods where possible.",
        feedback:
          "Practical and realistic approach. Shows experience with real-world constraints. Consider mentioning team coordination — how would you track progress and ensure consistency?",
      },
      {
        questionIndex: 3,
        question: "How did you resolve a disagreement with a designer?",
        answer:
          "A designer wanted a complex animation that caused jank on mobile. I built a prototype showing the performance issue, proposed an alternative using CSS transforms, and we iterated together to find a solution that was both beautiful and performant.",
        feedback:
          "Good collaborative approach. Demonstrates technical communication skills. The prototype idea is particularly strong — it shows rather than tells.",
      },
    ],
    summary: "Strong candidate with excellent frontend fundamentals.",
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    application_id: "20000000-0000-0000-0000-000000000008",
    status: "in_progress" as const,
    questions: [
      "How do you prioritize features when stakeholders have conflicting requirements?",
      "Describe your approach to writing a Product Requirements Document.",
      "Tell me about a product launch that didn't go as planned. What happened and what did you learn?",
      "How would you measure the success of our AI matching feature?",
      "Walk me through how you would conduct a user interview for a new feature.",
    ],
    answers: [
      {
        questionIndex: 0,
        question: "How do you prioritize features with conflicting requirements?",
        answer:
          "I use a weighted scoring framework considering impact, effort, and strategic alignment. I present data-backed trade-offs to stakeholders and facilitate alignment sessions.",
        feedback:
          "Good structured approach. Could be stronger with a specific example. Consider mentioning how you handle emotional stakeholders or executive override situations.",
      },
    ],
    summary: null,
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    application_id: "20000000-0000-0000-0000-000000000001",
    status: "in_progress" as const,
    questions: [
      "How do you ensure accessibility in a React application?",
      "Describe your approach to state management in a large React application.",
      "What testing strategies do you use for UI components?",
      "How would you implement a design token system that supports theming?",
      "Tell me about a time you mentored a junior developer.",
    ],
    answers: [],
    summary: null,
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    application_id: "20000000-0000-0000-0000-000000000003",
    status: "completed" as const,
    questions: [
      "Walk me through your design process for a complex B2B feature.",
      "How do you balance user needs with business goals in your designs?",
      "Describe a time you used research findings to change a product direction.",
    ],
    answers: [
      {
        questionIndex: 0,
        question: "Walk me through your design process.",
        answer:
          "I start with stakeholder interviews and competitive analysis, then create user journey maps. I iterate through low-fi wireframes to hi-fi prototypes with user testing at each stage.",
        feedback:
          "Comprehensive process description. Shows end-to-end ownership. Consider mentioning specific tools and how you document design decisions for engineering handoff.",
      },
      {
        questionIndex: 1,
        question: "How do you balance user needs with business goals?",
        answer:
          "I map user pain points to business metrics. For example, reducing onboarding friction (user need) directly improves activation rate (business goal). I present these connections to stakeholders.",
        feedback:
          "Excellent framing. Connecting user needs to business outcomes shows product thinking. Very strong answer.",
      },
    ],
    summary: "Strong design thinking with good business acumen.",
  },
];

export const MOCK_SAVED_JOBS = [
  {
    candidate_id: "00000000-0000-0000-0000-000000000010",
    job_id: "10000000-0000-0000-0000-000000000002",
  },
  {
    candidate_id: "00000000-0000-0000-0000-000000000010",
    job_id: "10000000-0000-0000-0000-000000000004",
  },
  {
    candidate_id: "00000000-0000-0000-0000-000000000011",
    job_id: "10000000-0000-0000-0000-000000000001",
  },
  {
    candidate_id: "00000000-0000-0000-0000-000000000013",
    job_id: "10000000-0000-0000-0000-000000000003",
  },
];
