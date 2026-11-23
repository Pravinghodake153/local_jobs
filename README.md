# local_jobs

> **SkillSetu** — Hyper-Local Blue-Collar Practical Skill Verification & Bilateral Trusted Hiring Platform.  
> Built for **wHACKiest 2026** (Online Ideathon · 26–27 Nov 2026) · **Track 4 – Mystery Track (UnlockED)**.

---

## Team Credentials: Team Hansraj_OP
* **Team ID:** `e2eeafbe`
* **College:** Mirai School of Technology, Bengaluru
* **Department:** Department of Computer Science and Engineering
* **Roster:**
  1. **Sayak Ghosh** (Lead) — USN: `1RM25CI049`
  2. **Prateek Deep Das** — USN: `1RM25CS041`
  3. **Pravin Ghodake** — USN: `1RM25CI018`

---

## Problem Statement
In India, over **250 million** blue- and grey-collar informal workers (electricians, plumbers, carpenters, masons, painters) operate without formal credentials or verifiable proof of practical competence. Consequently:
* **Workers** face arbitrary bargaining, irregular employment, and zero portable reputation.
* **Customers** risk hiring unverified individuals with no accountability or safety safeguards.
* **Existing Apps Fall Short:** Job portals rely on self-declared resumes; on-demand service aggregators enforce rigid pricing, centralize commissions, and rarely verify customers.

---

## The Solution: SkillSetu
SkillSetu introduces a decentralized, hyper-local trust network:
1. **Proof, Not Promises:** 30-second live practical task demonstrations verified against multi-modal AI rubrics (Amazon Bedrock checklist benchmarking safety gear, tooling, and live load testing).
2. **Two-Way Trust & Safety:** Mutual bilateral ratings and incident reports sealed strictly to confirmed completed transactions, with inspection photo evidence upload.
3. **Worker Autonomy with Fair Price Corridors:** Algorithmic price corridors calculate localized fair price bands (e.g., INR 300–700 per task); workers set their own rate inside the corridor, shielding technicians from predatory undercutting.
4. **Hyper-Local Geofencing:** Matches jobs and talent within a 5–15 km circular radius.
5. **Portable Credential:** Instant QR code credential cards and WhatsApp profile links for organic sharing.

---

## Design System: BookMyShow Inspired UI
* **BookMyShow CSS Elements:**
  * High-impact cinematic **Hero Billboard** with dark gradient scrims (`linear-gradient(90deg, rgba(15,23,42,0.94), rgba(15,23,42,0.35))`) and typography overlaid directly on photography.
  * **Poster Cards Grid** for verified tradespeople with floating BookMyShow rating pills (`★ 4.9/5.0 · 48 Jobs Done`), distance badges, and bottom text overlays.
  * **Cast & Crew Avatar Strip** for top verified masters and clients.
  * **Ticket-Style Booking Summaries** with perforated card edges and mutual confirmation checkpoints.
  * **Video Player Scanner HUD** simulating live Bedrock AI object recognition and checklist benchmarks.
* **Main 3 Colors:**
  * **Light:** `#FFFFFF`, `#F8FAFC`, `#F1F5F9`, `#E2E8F0`
  * **Dark:** `#0F172A`, `#1E293B`, `#334155`
  * **Saffron:** `#EA580C`, `#C2410C`, `#FFF7ED`, `#FDBA74`
  * **Strict Rules:** Zero emojis (SVG icons only), Light theme, Zero blue primary colors.

---

## Multi-Page Route Map

SkillSetu is architected with dedicated role URL sub-paths, supporting direct browser entry, server-side fallback, and client-side SPA routing:

### 1. Authentication Suite (`/auth/*`)
* `/auth/login` — Account sign in.
* `/auth/signup` — Dual-role registration (Worker vs. Customer).
* `/auth/forgot-password` — Two-step verification code dispatch & password reset.
* `/auth/demo` — 1-Click evaluator portal (Ravi, Suresh, Priya, Rajesh).

### 2. Worker Role (`/worker/*`)
* `/worker/dashboard` — Worker cockpit, trust score, completed jobs, and geofence circle.
* `/worker/skills` — AI Video Skill Verification Studio with Bedrock HUD scanner.
* `/worker/jobs` — Geofenced nearby job matches, quote submission inside corridor.
* `/worker/pricing` — Algorithmic price corridor calculator & rate setting.
* `/worker/profile` — Verifiable credential card with SVG QR code and WhatsApp share.

### 3. Customer Role (`/customer/*`)
* `/customer/dashboard` — Active bookings summary, quote alerts, and quick actions.
* `/customer/workers` — BookMyShow poster directory of verified technicians.
* `/customer/post-job` — Service request posting wizard with live price corridor guidance.
* `/customer/bookings` — Ticket-style booking manager with quote acceptance and completion confirmation.
* `/customer/reviews` — Bilateral review form with inspection evidence upload.

### 4. Commercial Site Contractor Role (`/contractor/*`)
* `/contractor/dashboard` — Commercial site supervisor cockpit and verified multi-trade roster.
* `/contractor/post-contract` — Broadcast commercial multi-worker contract requests.

### 5. Discovery & Credentials
* `/trades/:trade` — Dedicated landing pages for Electricians, Plumbers, Carpenters, Masons, Painters.
* `/profile/:id` — Public verified credential page with video proof rubric.

---

## Tech Stack
* **Runtime:** [Bun](https://bun.sh) (v1.2+)
* **Database:** Native Bun SQLite (`bun:sqlite`) with WAL mode
* **Backend:** Native `Bun.serve` with serverless-style REST API
* **Frontend:** Vanilla TypeScript / JavaScript, BookMyShow-inspired CSS3, inline SVG icons
* **Cloud & AI Reference Architecture:** AWS Cognito (Phone OTP), API Gateway + Lambda, Aurora PostgreSQL + PostGIS, Amazon S3 + CloudFront, Amazon Bedrock (Multi-modal video evaluation), ElevenLabs (Multilingual voice interactions).

---

## Getting Started

### Prerequisites
* [Bun](https://bun.sh) installed:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/Pravinghodake153/local_jobs.git
cd local_jobs

# Install dependencies (if any)
bun install

# Start the application server
bun run server.ts
# or run with hot-reload:
bun --watch server.ts
```

Open your browser at **`http://localhost:3000`**.

---

## Demo Credentials for Instant Evaluation
Select **"1-Click Evaluator Demo Access"** on the landing page or [`/auth/demo`](http://localhost:3000/auth/demo) to test pre-seeded personas:
* **Ravi Kumar (Worker · Electrician · 8 Yrs Exp):** Phone `9876543210` / Password `demo123`
* **Suresh M. (Worker · Plumber · PPR Specialist):** Phone `9876543211` / Password `demo123`
* **Priya Sharma (Customer · Homeowner):** Phone `9876543220` / Password `demo123`
* **Rajesh Verma (Contractor · Commercial Supervisor):** Phone `9876543221` / Password `demo123`

---

## License
MIT License. Built for wHACKiest 2026 Ideathon.
