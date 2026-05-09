# AI-Powered Recruitment Platform — Architecture & Design

## Introduction

The AI-Powered Recruitment Platform is a web application that reduces manual resume screening for recruiters and gives candidates meaningful feedback and interview practice. Its five core features are: structured job listings, AI resume parsing (PDF/DOCX), Match Score & Risk Evaluation per application, automated interview invitations, and a job-tailored AI Mock Interview module.

---

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend / API | Next.js 14 + TypeScript | SSR pages, REST API routes |
| AI Integration | OpenAI API + Vercel AI SDK | Parsing, scoring, streaming |
| Database | PostgreSQL (Prisma ORM) | Persistent data storage |
| Auth | JWT (24-hour expiry) | Stateless session management |
| File Storage | Private cloud bucket (S3) | Secure resume storage |
| Email | SMTP service (e.g. Resend) | Interview invitations |

---

## Architectural Design

### 2a. Chosen Architectural Style

The system uses a **Layered (N-Tier) Architecture** deployed as a **modular monolith**. Four layers are defined: Presentation, API, Service/Business Logic, and Data.

**Justification:**

- **Team size** — A two-person team manages a single codebase far more easily than coordinating independent microservices.
- **Next.js alignment** — The framework naturally maps to the layered model: React (Presentation) → Route Handlers (API) → Service functions (Logic) → Prisma (Data).
- **AI isolation** — The OpenAI API is called only from the Service layer, so swapping providers touches one module only.
- **Migration path** — Clear boundaries make it straightforward to extract a module into a microservice if needed later.

---

### 2b. Architectural Overview

#### Major Components

| Component | Responsibility |
|---|---|
| Presentation Layer | React UI for both portals (Recruiter Dashboard, Candidate Portal); streams AI responses via Vercel AI SDK. |
| API Route Layer | RESTful endpoints; validates JWTs on every request; rejects bad input before passing to the Service layer. |
| Service Layer | All domain logic (Auth, Job, Application, Scoring, Interview, Email services); orchestrates multi-step workflows; handles retries. |
| AI Integration | Wraps OpenAI calls; loads prompts from external config files; manages streaming for interview feedback. |
| Data Layer | Prisma ORM queries; all writes inside transactions; schema covers users, jobs, applications, interview sessions. |
| External Services | OpenAI API, cloud bucket (S3/R2), email provider — called only from the Service/AI layers. |

#### Component Interaction Flow

| From | To | Mechanism | Example |
|---|---|---|---|
| Presentation | API Route | HTTP fetch | `POST /api/applications` |
| API Route | Service Layer | TS function call | `applicationService.create()` |
| Service Layer | AI Integration | Async function | `scoringService.score()` |
| Service Layer | Data Layer | ORM query | `prisma.application.create()` |
| AI Integration | Presentation | SSE stream | `streamText() → UI` |

---

## Detailed Design

### Module 1 — Resume Parsing & AI Scoring

**Description**

When a candidate uploads a resume this module: (1) validates and stores the file, (2) extracts structured data via the OpenAI API, and (3) produces a Match Score (0–100) and Risk Evaluation by comparing the parsed resume to the job requirements.

| Aspect | Detail |
|---|---|
| Inputs | Resume file (PDF/DOCX/TXT, ≤5 MB), job record, candidate ID |
| Outputs | Parsed resume JSON; Match Score integer; Risk Evaluation string — all stored in DB |
| Dependencies | FileStorage, AIClient, ApplicationRepo, NotificationService |
| Error handling | Parse/score fail → retry twice; on persistent failure set status `manual_review` / display "Score unavailable" |

#### Internal Structure — Pseudo-code

```pseudocode
// API Route: POST /api/applications
async handleUpload(request):
  validateJWT(request)                          // 401 if invalid
  { jobId, file } = parseMultipartForm(request)
  if file.ext NOT IN [pdf, docx, txt]: return 422
  if file.size > 5 MB: return 422
  app = await ApplicationService.create(candidateId, jobId)
  await ScoringService.processApplication(app.id, file)
  return 201 { applicationId }

// ScoringService.processApplication
async processApplication(appId, file):
  url    = await FileStorage.uploadPrivate(file)
  text   = await FileStorage.extractText(url)
  parsed = await withRetry(2): AIClient.parseResume(text)
  if !parsed:
    await ApplicationRepo.setStatus(appId, "manual_review")
    await NotificationService.alertRecruiter(appId); return
  await ApplicationRepo.saveParsedResume(appId, parsed)
  job    = await JobRepo.findById(app.jobId)
  result = await withRetry(2): AIClient.scoreApplication(parsed, job)
  score  = result ?? { score: null, riskText: "Score unavailable" }
  await ApplicationRepo.setScore(appId, score.score, score.riskText)

// AIClient.parseResume / scoreApplication
async parseResume(text):
  prompt = loadPromptConfig("resume_parse")     // external config (SR-NF6)
  res = await openai.chat.completions.create({
    model: "gpt-4o", response_format: "json_object",
    messages: [{ role: "system", content: prompt },
               { role: "user",   content: text }]
  })
  return JSON.parse(res.choices[0].message.content)
```

#### Key Classes

| Class | Key Methods | Collaborators |
|---|---|---|
| ScoringService | `processApplication`, `withRetry` | FileStorage, AIClient, ApplicationRepo |
| AIClient | `parseResume`, `scoreApplication` | OpenAI API, PromptConfig files |
| ApplicationRepo | `create`, `saveParsedResume`, `setScore` | Prisma (PostgreSQL) |

---

### Module 2 — Mock Interview Engine

**Description**

Accessible only when `application.status == "interview_scheduled"`. Generates 5–10 job-tailored questions, presents them one at a time, and streams real-time feedback on each answer (relevance, depth, suggestions). Sessions are persisted for later review.

| Aspect | Detail |
|---|---|
| Inputs | Candidate ID, Application ID (status-gated), answer text per question |
| Outputs | Questions list, streamed feedback per answer, saved session summary |
| Dependencies | ApplicationRepo, JobRepo, AIClient, InterviewSessionRepo, Vercel AI SDK |

#### Internal Structure — Pseudo-code

```pseudocode
// POST /api/interviews/start
async startSession(request):
  candidate = validateJWT(request)
  app = await ApplicationRepo.findById(request.body.applicationId)
  if app.candidateId != candidate.id: return 403
  if app.status != "interview_scheduled": return 403
  session = await InterviewService.createSession(app.id)
  return 201 { sessionId, questions: session.questions }

// InterviewService.createSession
async createSession(appId):
  job       = await JobRepo.findById(app.jobId)
  questions = await withRetry(2): AIClient.generateQuestions(job)
  if !questions: throw Error("retry_later")
  return await InterviewSessionRepo.create({ appId, questions })

// POST /api/interviews/:id/answer (streaming response)
async submitAnswer(request):
  { questionIndex, answerText } = request.body
  if answerText.trim() == "": return 422
  question     = session.questions[questionIndex]
  stream       = AIClient.streamFeedback(question, answerText)
  fullFeedback = ""
  for await chunk of stream:
    write(chunk) to response              // live SSE to UI
    fullFeedback += chunk
  await InterviewSessionRepo.saveAnswer(sessionId, questionIndex,
                                        answerText, fullFeedback)
```

---

### Module 3 — Authentication & Access Control

**Description**

Handles registration, login, JWT issuance, and per-request token validation via Next.js middleware. Role-based guards (Recruiter vs. Candidate) are enforced in the Service layer.

#### Internal Structure — Pseudo-code

```pseudocode
// AuthService
async register(email, password, role):
  if !validEmail(email) || password.length < 8: throw ValidationError
  if await UserRepo.findByEmail(email): throw ConflictError
  hashed = await bcrypt.hash(password, 12)
  user   = await UserRepo.create({ email, hashed, role })
  return { user, token: issueJWT(user) }

async login(email, password):
  user = await UserRepo.findByEmail(email)
  if !user || !bcrypt.compare(password, user.password):
    throw AuthError("Invalid credentials")   // no email enumeration
  return { user, token: issueJWT(user) }

function issueJWT(user):
  return jwt.sign({ sub: user.id, role: user.role },
                  process.env.JWT_SECRET, { expiresIn: "24h" })

// Middleware runs on every /api/* route
function jwtMiddleware(request):
  token = request.headers.Authorization?.split(" ")[1]
  if !token: return 401
  try:
    request.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  catch: return 401
```

---

## Design Evaluation

### a) Modularity

Six independent modules (`auth/`, `jobs/`, `applications/`, `scoring/`, `interviews/`, `email/`) each own their route, service, and repository files. No layer contains mixed responsibilities, and the shared `AIClient` utility isolates all OpenAI concerns in one place.

### b) Maintainability & Extensibility

New features (e.g. Duplicate Application Detector) require only a new service file and route — no existing code changes (Open/Closed Principle). Prompts are external config files (SR-NF6), so AI behaviour can be updated without deployment. Provider swaps (email, AI) affect only one service implementation.

### c) Scalability

Next.js on Vercel scales API routes horizontally as stateless serverless functions. PostgreSQL connection pooling handles 200+ concurrent users; read replicas can be added without ORM changes. S3-backed file storage scales independently of compute. If the Mock Interview Engine becomes a bottleneck, its clear boundary makes microservice extraction straightforward.

### d) Trade-offs

| Decision | Trade-off |
|---|---|
| Modular monolith | Simpler to operate, but all modules share one runtime — a heavy parsing job could affect unrelated routes. |
| Single AI vendor | Keeps the codebase small; mitigated by retry logic and "unavailable" fallback states. |
| Synchronous scoring | Candidate waits after upload. A background job queue would be more robust but adds operational complexity. |
| JWT without refresh | Simpler implementation; acceptable for a platform used sporadically. |

### e) Alternative Designs Considered

- **Microservices** — Better isolation and independent scaling, but requires service discovery, inter-service auth, and distributed tracing — unjustified for a two-person MVP team.
- **GraphQL API** — Reduces over-fetching, but the data access patterns are simple and predictable, making the extra schema overhead unnecessary.
- **WebSockets for streaming** — Supports bidirectional communication but requires persistent connections incompatible with serverless. SSE via the Vercel AI SDK fits the unidirectional feedback pattern perfectly.
- **MongoDB** — Flexible for semi-structured resume JSON, but PostgreSQL's JSONB column handles this equally well while providing relational integrity (foreign keys) that a document store cannot enforce.