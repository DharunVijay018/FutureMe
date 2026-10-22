# FutureMe Vault — Sovereign Time-Capsule SaaS

> **"A message from who you are today, to who you will become."**

FutureMe Vault is an enterprise-grade, privacy-first digital time-capsule web application built with **Next.js 14 App Router**, **TypeScript (Strict Mode)**, **Tailwind CSS**, and **PostgreSQL with Row Level Security (RLS)**. It enables users to draft personal letters, reflections, predictions, and goal milestones, attach photographs, and seal them behind an authoritative, server-enforced time-lock.

---

## 1. Quick Start Guide for Visual Studio Code

### Step 1: Open the Project in VS Code
You can open this project in VS Code in either of two ways:
- **From VS Code**: Launch VS Code, click **File > Open Folder...**, navigate to your Desktop, and select the `FutureMe-Vault` folder.
- **From Windows Terminal / PowerShell**:
  ```bash
  code "$HOME\Desktop\FutureMe-Vault"
  ```

### Step 2: Open the Integrated Terminal
In VS Code, press `Ctrl + \`` (Ctrl + backtick) or click **Terminal > New Terminal** from the top menu.

### Step 3: Install Required Dependencies
All required dependencies are specified in `package.json` and locked with `package-lock.json`. Run:
```bash
npm install
```
*(Dependencies are already pre-installed in this local export, so this will quickly verify everything is in place).*

### Step 4: Configure Environment Variables (Optional)
The project is built with **dual-mode architecture**:
- **Out of the Box (Local Fallback Mode)**: No `.env.local` is required to run the application immediately. Authentication, sample capsules, drafting, sealing, time-locks, countdowns, and simulated notifications function 100% offline out-of-the-box.
- **Production Supabase Mode**: If you want to connect to a live Supabase project, copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
  Then fill in your Supabase credentials (see [Section 6](#6-connecting-supabase-production-database--auth) below).

### Step 5: Start the Development Server
Execute the following command in the VS Code terminal:
```bash
npm run dev
```

### Step 6: View the Website in Chrome
Open your web browser (Google Chrome, Edge, Brave, etc.) and navigate to:
```text
http://localhost:3000
```
- Click **"Sign In"** and use the 1-click **"Fill Demo Account"** button (`traveler@futuremevault.io` / `Vault2026!`) to immediately test sealed, ready-to-open, and archived capsules.
- Or click **"Create your first capsule"** to go through the 5-step creation, attachment, and sealing ceremony.

### Step 7: How to Stop the Server
When you want to stop the local development server:
1. Click into the VS Code terminal where `npm run dev` is running.
2. Press `Ctrl + C`.
3. If prompted `Terminate batch job (Y/N)?`, type `Y` and press `Enter`.

### Step 8: How to Make Changes and See Live Updates
Next.js provides **Fast Refresh** (Hot Module Replacement):
- Open any file under `src/app/` (for example, edit text in `src/app/page.tsx` or `src/app/dashboard/page.tsx`).
- Save the file (`Ctrl + S`).
- Look at your browser window—the changes will appear instantly without losing your state or requiring a manual page refresh.

### Step 9: Running Tests & Production Build
Run the comprehensive Vitest test suite (43 unit & integration tests covering authorization, time-lock gates, attachment RLS, cron jobs, and timezone shifts):
```bash
npm test
```
To run the optimized production build and verify TypeScript types:
```bash
npm run build
```

---

## 2. Core Architecture & Time-Lock Security Guarantees

Unlike generic templates that merely hide an unseal button or rely on client-side timer checks, **FutureMe Vault enforces temporal locks at both the PostgreSQL database layer and server API boundary**:

1. **Server-Side Authorization & Content Redaction**:
   - When a capsule is in `'sealed'` status and `now() < scheduled_opening_at` (evaluated strictly in UTC), server route handlers (`/api/capsules/[id]`) **redact the message body** and return `"[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]"`.
   - Private attachments are strictly **redacted** (`attachments: []`).
   - Dedicated attachment proxy (`/api/capsules/[id]/attachments/[attachmentId]`) rejects pre-unlock downloads with **HTTP 403: `TIME_LOCK_VIOLATION`**.
   - Any programmatic unsealing before the scheduled timestamp returns **HTTP 403 Forbidden: `TIME_LOCK_VIOLATION`**.

2. **Tamper-Resistant Clock Verification**:
   - Eligibility is evaluated exclusively against the authoritative UTC server clock, preventing client clock manipulation attacks.
   - Timezone calculations use `Intl.DateTimeFormat` parts to guarantee accurate UTC mapping across Daylight Saving Time (EDT/EST, UTC offsets).

3. **Insecure Direct Object Reference (IDOR) & RLS**:
   - User ownership isolation is enforced at both the database policy level (`auth.uid() = owner_id`) and API layer.
   - Querying another user's capsule or attachments returns **HTTP 403 Forbidden: `ACCESS_DENIED`**.

4. **State Transition Rigidity**:
   - Drafts can be edited.
   - Once sealed, `PATCH` modifications return **HTTP 400: `IMMUTABLE_ERROR`** and deletions return **HTTP 403: `PROTECTION_RULE`** to preserve the honesty of the historical record.

---

## 3. Visual Design System

Built dark-mode-first with a futuristic, editorial aesthetic:

- **Jet Black**: `#08090D` (Application canvas)
- **Deep Surface**: `#10131B` (Card backings & deep wells)
- **Elevated Surface**: `#161B27` (Modals, cards, active controls)
- **Cerulean Blue**: `#36B8F5` (Primary actions, countdown digits, time indicators)
- **Neon Rose**: `#FF4F9A` (Emotional highlights, ready-to-open milestones, accent seals)
- **Primary Text**: `#F4F7FC`
- **Secondary Text**: `#A8B3C7`
- **Charcoal Borders**: `#1E2638` & `#26324A`
- **Typography Pairing**: Space Grotesk (Editorial headings) + Inter (Interface & body text)

---

## 4. Key Application Features

- **Public Landing Page**: Editorial storytelling, 3-step mechanics, interactive sealed-capsule countdown preview, security explanation, FAQ accordion, zero fake metrics.
- **Authentication**: Sign up, sign in, sign out, password reset, with a 1-click **"Demo Traveler"** fast-login button for portfolio review.
- **Personalized Mission Dashboard**: Time-based greeting ("Good morning/afternoon/evening, [User]"), live metrics queried strictly from database records, upcoming unlock countdown ticker, ready-to-open celebration cards, search and filter.
- **5-Stage Creation Studio**:
  1. *Type Selection*: Letter, Goal, Prediction, Memory, Custom.
  2. *Rich Composer*: Title, message editor, category tags, character/word counters, dynamic guided reflection prompts, automatic local draft preservation.
  3. *Memory Preservation*: Image uploads (JPEG, PNG, WebP) with custom captions.
  4. *Temporal Scheduling*: Horizon presets (1m, 6m, 1y, 3y, 5y), custom datetime selector with strict past-date rejection, explicit IANA timezone mapping.
  5. *Preview & Sealing*: Detailed review with explicit modal confirmation before irreversible sealing.
- **Vault Archive**: Tabbed browsing (*All*, *Sealed*, *Ready to Open*, *Opened*), search by title/category, live countdown cards.
- **Opening Ceremony**: Server eligibility verification, subtle opening transition with celebratory confetti blast, revealed letter & memory photos, post-unlock reflection journaling.
- **Settings & Sovereignty**: Profile management, timezone preference, email notification toggle, GDPR JSON data export, and complete account deletion with cascade purge.

---

## 5. Project Directory Structure

```text
FutureMe-Vault/
├── .vscode/                 # VS Code workspace settings & recommended extensions
├── public/                  # Static assets & SVG icons
├── src/
│   ├── app/
│   │   ├── api/             # Next.js App Router Route Handlers
│   │   │   ├── capsules/    # /api/capsules/[id] & attachments proxy
│   │   │   └── cron/        # /api/cron/process-notifications scheduled processor
│   │   ├── auth/            # Signin, Signup, Password Reset pages
│   │   ├── create/          # 5-Stage Capsule Creation Studio
│   │   ├── dashboard/       # User Mission Dashboard
│   │   ├── settings/        # Account & Sovereignty settings
│   │   ├── vault/           # Capsule Vault archive & detail pages
│   │   ├── globals.css      # Design system CSS & Tailwind utilities
│   │   ├── layout.tsx       # Root layout with fonts & Navbar/Footer
│   │   └── page.tsx         # High-impact editorial landing page
│   ├── components/          # Reusable UI primitives (Button, Modal, Countdown, etc.)
│   ├── lib/                 # Core domain logic
│   │   ├── auth/            # Dual-mode authentication service
│   │   ├── capsules/        # Capsule service & time-lock engine
│   │   ├── notifications/   # Idempotent notification service
│   │   ├── supabase/        # Supabase client & server factory
│   │   ├── time/            # Timezone & UTC conversion math
│   │   └── validations/     # Zod schema validation rules
│   └── types/               # TypeScript data definitions & database schemas
├── supabase/
│   └── migrations/          # Complete SQL schema & security hardening scripts
├── .env.example             # Documented template of environment variables
├── .gitignore               # Excludes secrets, node_modules, and build output
├── package.json             # Scripts & dependency definitions
├── tailwind.config.ts       # Color palette & typographic scale
├── tsconfig.json            # Strict TypeScript configuration
└── vitest.config.ts         # Vitest test runner configuration
```

---

## 6. Connecting Supabase (Production Database & Auth)

To switch from the local fallback engine to a cloud Supabase instance:
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the migrations in order:
   - `supabase/migrations/20261022000001_create_futureme_vault_schema.sql`
   - `supabase/migrations/20261022000002_security_hardening.sql`
3. Create a private Storage bucket named `capsule-memories`.
4. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Enter your project API keys in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
   CRON_SECRET=your-random-32-char-cron-secret
   ```
6. Restart the dev server (`npm run dev`). The application will seamlessly connect to your live PostgreSQL database!
