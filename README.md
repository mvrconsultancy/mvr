<div align="center">

# MVR Consultants

### *Dream. Plan. Achieve.*

**A production-grade consultancy platform for Study Abroad, Visa Guidance, Scholarships & University Admissions**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-2024_Edition-CE422B?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📋 Project Overview

MVR Consultants is a **premium, SEO-first consultancy website** serving students seeking study abroad opportunities, visa guidance, scholarships, and university admissions support.

| Feature | Description |
|---------|-------------|
| 🌍 Study Abroad | Destination guides (CMS-managed, API-backed) for 26+ countries |
| 🎓 University Admissions | Full university directory with fees, IELTS, programs & search |
| 💰 Scholarships | Admin-managed scholarships synced to the public site |
| 📋 Visa Guidance | Country-specific visa process guides |
| 👤 Lead Management | Full CRM with status tracking and counselor assignment |
| 📝 Blog / CMS | Admin-managed articles with cover images & draft/publish workflow |
| 💬 Testimonials | Client testimonials on homepage and `/testimonials` |
| 📊 Admin Dashboard | Analytics, leads, blogs, countries, universities, scholarships & users |

---

## 🏗️ Architecture

```
Client Browser
      ↓  (same-origin /api/* + httpOnly cookies)
┌─────────────────────────────┐
│  Frontend (Vercel)          │
│  Next.js 16 + React 19      │
│  /api/[...path] proxy       │
└─────────────┬───────────────┘
              │ server-side proxy
              ↓
┌─────────────────────────────┐
│  Backend (Render)           │
│  Rust + Axum  Port: 8080    │
│  Redis (session blocklist)  │
└─────────────┬───────────────┘
              ↓
      Supabase (PostgreSQL)
```

**Single source of truth:** Admin CMS edits are stored in Postgres and served via the API to the public website (countries, blogs, universities, scholarships, testimonials). Static JSON in `frontend/src/data/` is used only as a build-time fallback when the API is unreachable.

> **Admin login:** `https://www.mvrconsultants.org/admin/login` — apex `mvrconsultants.org` redirects to `www` via Vercel.

> **Production URLs:** [HANDOFF.md](HANDOFF.md) — full client transfer checklist, DNS, and env vars.

> For local development, an optional Nginx reverse proxy is available via Docker Compose.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.6 | React framework with App Router |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Base UI | 1.x | Headless UI primitives |
| shadcn | 4.x | Component scaffolding CLI |
| Framer Motion | 12.x | Animations & transitions |
| Zustand | 5.x | Client state management |
| TanStack Query | 5.x | Server state & data fetching |
| React Hook Form | 7.x | Form management |
| Zod | 4.x | Schema validation |
| Axios | 1.x | HTTP client |
| Sonner | 2.x | Toast notifications |
| Lucide React | 1.x | Icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Rust | 2024 Edition | Systems language |
| Axum | 0.7 | Web framework |
| Tokio | 1.x | Async runtime |
| Tower HTTP | 0.5 | Middleware (CORS, tracing, compression) |
| SQLx | 0.8 | Async PostgreSQL driver |
| Serde | 1.x | JSON serialization |
| jsonwebtoken | 9.x | JWT auth |
| Argon2 | 0.5 | Password hashing |
| Redis | 0.27 | JWT blocklist (logout revocation) |
| Tracing | 0.1 | Structured logging |
| reqwest | 0.12 | HTTP client (Cloudinary, Resend) |
| resend-rs | 0.25 | Transactional email |
| validator | 0.19 | Request validation |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Supabase | Hosted PostgreSQL (shared team DB) |
| Vercel | Frontend hosting & edge deployment |
| Render | Backend Docker-based hosting (Singapore region) + Redis |
| Hostinger | Domain DNS (CNAME `www` → Vercel; business email via MX) |
| Cloudinary | Image uploads & CDN delivery |
| Resend | Transactional email |
| Docker + Compose | **Local development** orchestration only |
| Nginx | **Local dev** reverse proxy only |

---

## 📁 Folder Structure

```
mvr/
├── frontend/                  # Next.js 16 application
│   ├── public/                # Static assets, favicons, logo
│   └── src/
│       ├── app/
│       │   ├── (public)/      # Public-facing pages
│       │   │   ├── page.tsx   # Homepage
│       │   │   ├── about/
│       │   │   ├── blogs/
│       │   │   ├── contact/
│       │   │   ├── countries/
│       │   │   ├── faq/
│       │   │   ├── privacy/
│       │   │   ├── scholarships/
│       │   │   ├── testimonials/
│       │   │   ├── terms/
│       │   │   ├── universities/
│       │   │   └── visa/
│       │   ├── admin/         # Admin panel (cookie-gated)
│       │   │   ├── page.tsx   # Admin dashboard
│       │   │   ├── blogs/
│       │   │   ├── countries/
│       │   │   ├── leads/
│       │   │   ├── login/
│       │   │   ├── newsletter/
│       │   │   ├── scholarships/
│       │   │   ├── testimonials/
│       │   │   ├── unis/
│       │   │   └── users/
│       │   ├── api/[...path]/ # Same-origin API proxy → Render backend
│       ├── components/        # UI components
│       ├── services/          # API service layer
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utilities
│       ├── store/             # Zustand stores
│       ├── constants/         # App constants
│       ├── data/              # Static data
│       ├── styles/            # Global styles
│       └── types/             # TypeScript types
│
├── backend/                   # Rust + Axum API server
│   ├── src/
│   │   ├── config/            # Environment config
│   │   ├── routes/            # Route definitions + AppState
│   │   ├── handlers/          # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Data access layer
│   │   ├── models/            # Data models
│   │   ├── middleware/        # Auth, CORS middleware
│   │   ├── db/                # Database connection pool
│   │   └── utils/             # JWT, errors, response helpers
│   ├── migrations/            # SQLx SQL migrations
│   ├── examples/              # One-off seed scripts (countries, universities, admin)
│   └── .cargo/audit.toml      # cargo-audit policy (ignored advisories)
│
├── supabase/                  # Supabase config & migrations
│   ├── migrations/
│   └── seed/
│
├── nginx/                     # Nginx reverse proxy config (local dev)
├── docker-compose.yml         # Full stack local orchestration
├── render.yaml                # Render deployment blueprint (backend)
├── .env.example               # Environment variable template
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Rust | 1.85+ | [rustup.rs](https://rustup.rs) |
| Docker Desktop | latest | [docker.com](https://www.docker.com) |
| Git | latest | [git-scm.com](https://git-scm.com) |

### 1. Clone the repository
```bash
git clone https://github.com/mvrconsultancy/mvr.git
cd mvr
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase URL, JWT secret, Cloudinary keys, etc.
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

### 3. Start with Docker Compose (local dev)
```bash
docker compose up --build
```

This starts:
- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:8080
- **Nginx** → http://localhost:80

### 4. Or run services individually

**Frontend (development)**
```bash
cd frontend
npm install
npm run dev
```

**Backend (development)**
```bash
cd backend
cargo run
# API at http://localhost:8080 — frontend proxies /api/* via BACKEND_URL
```

### 5. Seed production data

On startup, the backend **automatically upserts** universities and countries when the DB has fewer than 50 / 20 rows (see [`backend/src/db/seed.rs`](backend/src/db/seed.rs)). A redeploy backfills sparse production databases without manual steps.

For a full manual re-seed or local dev:

```bash
cd backend
cargo run --example seed_admin -- "YourSecurePassword"
cargo run --example seed_countries
cargo run --example seed_universities
```

**Render env checklist** (set in Dashboard if features are silent):
- `RESEND_API_KEY` — contact form emails via [Resend](https://resend.com); verify `mvrconsultants.org` DNS in Hostinger; check `GET /health` → `email.resend_configured: true`
- `EMAIL_FROM` — `noreply@mvrconsultants.org` (verified sender in Resend)
- `ADMIN_EMAIL` / `ADMIN_EMAIL_GUNTUR` — `guntur@mvrconsultants.org` (Hostinger inbox receives alerts)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — admin image uploads

---

## 🔑 Environment Variables

See [`.env.example`](.env.example), [`frontend/.env.example`](frontend/.env.example), and [`backend/.env.example`](backend/.env.example) for complete lists.

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `REDIS_URL` | **Required in production** — Render Redis internal URL |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens |
| `JWT_EXPIRY_HOURS` | Access token expiry in hours (default: 24) |
| `JWT_REFRESH_EXPIRY_DAYS` | Refresh token expiry in days (default: 30) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary **signed** upload preset (`mvr_consultants`) |
| `RESEND_API_KEY` | Resend email API key |
| `EMAIL_FROM` | Sender email address |
| `ADMIN_EMAIL` | Primary admin notification email |
| `ADMIN_EMAIL_GUNTUR` | Guntur office notification email |
| `ALLOWED_ORIGINS` | CORS origins (e.g. `https://www.mvrconsultants.org`) |
| `TRUST_PROXY_HEADERS` | Set `true` on Render for correct client IP / rate limits |
| `RUST_LOG` | Log level (e.g. `info`, `debug`) |

### Frontend (Vercel)

**Client project:** [MvrConsultancy / `mvr`](https://vercel.com/mvr-consultancy/mvr) — root directory **`frontend`**

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | **Required** — Render backend URL (e.g. `https://mvr-umqq.onrender.com`). Used by the `/api` proxy and SSR fetches. |
| `NEXT_PUBLIC_APP_URL` | Public site URL (e.g. `https://www.mvrconsultants.org`) |

Copy-paste reference: [`frontend/vercel.production.env.example`](frontend/vercel.production.env.example)

> Browser requests use same-origin `/api/*` (no `NEXT_PUBLIC_API_URL` to Render needed in production). Auth uses httpOnly cookies (`mvr_access`, `mvr_refresh`).

## 🗺️ API Reference

### Public Routes (no auth required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/login` | POST | Login (sets httpOnly cookies) |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/blogs` | GET | List published blogs |
| `/api/blogs/{slug}` | GET | Get blog by slug |
| `/api/countries` | GET | List active country cards |
| `/api/countries/{slug}` | GET | Full country detail (JSONB content) |
| `/api/universities` | GET | List universities (paginated) |
| `/api/universities/{slug}` | GET | University detail by slug |
| `/api/scholarships` | GET | List scholarships |
| `/api/testimonials` | GET | List testimonials (`?featured=true` for homepage) |
| `/api/contact` | POST | Submit contact form |
| `/api/leads` | POST | Submit inquiry / lead form |
| `/api/newsletter/subscribe` | POST | Newsletter signup |

### Protected Routes (valid JWT required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/logout` | POST | Logout (revoke tokens + clear cookies) |
| `/api/auth/me` | GET | Get current user profile |

### Admin Routes (ADMIN role + httpOnly cookie)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create a new staff account |
| `/api/admin/stats` | GET | Dashboard analytics |
| `/api/admin/recent-leads` | GET | Recent lead activity |
| `/api/admin/blogs` | GET | List all blogs (including drafts) |
| `/api/admin/countries` | GET / POST | List / create countries |
| `/api/admin/countries/{id}` | PUT / DELETE | Update / delete country |
| `/api/admin/universities` | GET | List all universities (incl. inactive) |
| `/api/admin/users` | GET | List staff users |
| `/api/admin/users/{id}/role` | PUT | Change user role |
| `/api/admin/users/{id}/active` | PATCH | Activate / deactivate user |
| `/api/admin/cloudinary/sign` | POST | Signed Cloudinary upload |
| `/api/admin/newsletter` | GET | List newsletter subscribers |
| `/api/leads` | GET | List all leads |
| `/api/leads/{id}` | GET / PUT / DELETE | Manage individual lead |
| `/api/blogs` | POST | Create blog post |
| `/api/blogs/{id}` | PUT / DELETE | Edit or delete blog (UUID) |
| `/api/universities` | POST | Add university |
| `/api/universities/{id}` | PUT / DELETE | Edit or delete university (UUID) |
| `/api/scholarships` | POST | Add scholarship |
| `/api/scholarships/{id}` | PUT / DELETE | Edit or delete scholarship |
| `/api/testimonials` | POST | Add testimonial |
| `/api/testimonials/{id}` | PUT / DELETE | Edit or delete testimonial |

---

## 🚢 Deployment

| Service | URL / project |
|---------|-----------------|
| Public site | `https://www.mvrconsultants.org` |
| Vercel (frontend) | [`mvr`](https://vercel.com/mvr-consultancy/mvr) — deploy URL: `https://mvr.vercel.app` |
| Render (backend) | `https://mvr-umqq.onrender.com` |
| GitHub | [`mvrconsultancy/mvr`](https://github.com/mvrconsultancy/mvr) |

See [HANDOFF.md](HANDOFF.md) for the full client transfer checklist.

### Backend → Render

The backend deploys via [`render.yaml`](render.yaml) as a Docker web service in **Singapore**, with a **Redis** instance for JWT blocklist (logout revocation). Client service: **`mvr-umqq`**.

```bash
# Set secret env vars in: Render Dashboard → mvr-umqq → Environment
# Required: DATABASE_URL, JWT_*, REDIS_URL, CLOUDINARY_*, RESEND_API_KEY, ALLOWED_ORIGINS
```

After first deploy, run seed scripts locally against production `DATABASE_URL` (see [Quick Start](#-quick-start)).

### Frontend → Vercel

The frontend deploys to the client's Vercel project **`mvr`** (team **MvrConsultancy**) on push to `master`. **Root directory must be `frontend`.**

```bash
# Required Vercel Production env vars:
BACKEND_URL=https://mvr-umqq.onrender.com
NEXT_PUBLIC_APP_URL=https://www.mvrconsultants.org
```

The Next.js app proxies `/api/*` to Render via `src/app/api/[...path]/route.ts` so admin auth cookies stay same-origin.

```bash
cd frontend && npm run build   # Vercel runs this automatically
```

### DNS (Hostinger → Vercel)

Canonical host is **`www`**. Apex redirects to www at the Vercel edge (not in app code).

| Hostinger record | Value |
|------------------|-------|
| `www` CNAME | `38a1e8e29e879bb4.vercel-dns-017.com` (from Vercel → Domains panel) |
| `@` A | Vercel-provided IP (e.g. `76.76.21.21` — copy from Vercel dashboard) |

**Remove** the old `www` CNAME → `mvrconsultants.org` (causes invalid Vercel config).

**Do not delete** email DNS: MX, SPF, DMARC, Resend/Hostinger DKIM CNAMEs — see [HANDOFF.md Phase 5](HANDOFF.md#phase-5--custom-domain-hostinger-dns--client-vercel--action-required).

Verify after DNS changes:

```bash
cd frontend && node scripts/verify-domain-dns.mjs
```

---

## 📈 Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Auth, API proxy, uploads, admin bug fixes | ✅ Done |
| **Phase 2** | CMS → public site sync (countries, unis, scholarships, testimonials) | ✅ Done |
| **Phase 3** | Admin UX components, full country/university editors | ✅ Done |
| **Phase 4** | CI (fmt, clippy, audit), production hardening | ✅ Done |
| **Phase 5** | Monitoring, cache invalidation, performance tuning | ⏳ Pending |

---

## 🤝 Contributing & Branch Strategy

We use a structured branch strategy with automated checks:
- **`master`** — The production branch. Direct pushes are protected; only deployment-ready PRs from `dev` or critical `hotfix/*` branches are merged here.
- **`dev`** — The integration/development branch.
- **`feature/*`** — Individual feature development. Created from `dev` and merged back into `dev` via Pull Request.
- **`hotfix/*`** — Emergency production fixes. Created from `master` and merged back into both `master` and `dev`.

### Pull Request & CI/CD Guidelines
1. Create a feature branch from `dev`: `git checkout -b feature/your-feature-name dev`.
2. Follow conventional commits (`feat:`, `fix:`, `chore:`).
3. Ensure local checks pass before submitting a PR:
   - Backend: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo audit`, `cargo test`
   - Frontend: `npm run build` (includes `tsc`), `node scripts/verify-domain-dns.mjs` (after DNS changes)
4. Submit a Pull Request targeting the `dev` branch. Our automated GitHub Action (`PR Checks`) will run clippy, tests, and build validation. Once approved and checks pass, it can be merged.
5. Merging `dev` into `master` triggers the production deployment pipeline (`CI` workflow), which automatically runs all checks and deploys the backend to Render.

---

## 📄 License

Copyright © 2025 MVR Consultants. All rights reserved.

---

<div align="center">
  <em>Built with ❤️ by Team BinaryScouts</em>
</div>
