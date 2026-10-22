# FutureMe Vault — Sovereign Time-Capsule SaaS

> **"A message from who you are today, to who you will become."**

FutureMe Vault is an enterprise-grade, privacy-first digital time-capsule web application built with **Next.js 14 App Router**, **TypeScript (Strict Mode)**, **Tailwind CSS**, and **PostgreSQL with Row Level Security (RLS)**. It enables users to draft personal letters, reflections, predictions, and goal milestones, attach photographs, and seal them behind an authoritative, server-enforced time-lock.

---

## 1. Core Architecture & Time-Lock Security Guarantees

### Non-Negotiable Time-Lock Enforcement
Unlike generic time-capsule templates that merely hide an unseal button or rely on client-side timer checks, **FutureMe Vault enforces temporal locks at both the PostgreSQL database layer and server API boundary**:

1. **Server-Side Authorization & Masking**:
   - When a capsule is in `'sealed'` status and `now() < scheduled_opening_at` (evaluated strictly in UTC), server actions and API route handlers (`/api/capsules/[id]`) **redact the message body** and return `"[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]"`.
   - Private attachments are strictly **redacted** (`attachments: []`).
   - Any direct programmatic attempt to invoke unsealing before the scheduled timestamp returns **HTTP 403 Forbidden: `TIME_LOCK_VIOLATION`**.

2. **Tamper-Resistant Clock Verification**:
   - Eligibility is evaluated exclusively against the authoritative UTC server clock, preventing client clock manipulation attacks.
   - For automated testing and determinism, service methods accept an optional `referenceNow` parameter, avoiding any weakening of production security.

3. **Insecure Direct Object Reference (IDOR) & RLS**:
   - User ownership isolation is enforced at the database policy level (`auth.uid() = owner_id`).
   - Querying another user's capsule returns **HTTP 403 Forbidden: `ACCESS_DENIED`**.

4. **Immutability Once Sealed**:
   - Once a capsule is sealed, edits to the message text, title, or attachments are permanently locked to preserve the honesty of the historical record.

---

## 2. Visual Design System

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

## 3. Database Schema & Migrations

The full SQL migration script is located at:
`supabase/migrations/20261022000001_create_futureme_vault_schema.sql`

### Tables
- `profiles`: User identity, display names, avatars, and primary timezone.
- `capsules`: Core capsule records (`title`, `content`, `capsule_type`, `status`, `category`, `scheduled_opening_at`, `sealed_at`, `opened_at`).
- `capsule_attachments`: Metadata and storage pointers for images and media.
- `capsule_reflections`: Post-unlock journaling entries written after opening.
- `notification_preferences`: User opt-ins for unlock alerts and early reminders.
- `notification_delivery_records`: Audit log guaranteeing idempotent notification delivery.

### Key RLS Function
```sql
CREATE OR REPLACE FUNCTION public.can_view_capsule_content(capsule_row public.capsules)
RETURNS BOOLEAN AS $$
BEGIN
    IF capsule_row.status = 'draft' THEN RETURN TRUE; END IF;
    IF capsule_row.status = 'opened' THEN RETURN TRUE; END IF;
    IF capsule_row.status = 'sealed' AND timezone('utc', now()) >= capsule_row.scheduled_opening_at THEN
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Key Application Features

- **Public Landing Page**: Editorial storytelling, 3-step mechanics, interactive sealed-capsule countdown preview, security explanation, FAQ accordion, zero fake metrics.
- **Authentication**: Sign up, sign in, sign out, password reset, with a 1-click **"Demo Traveler"** fast-login button for portfolio review.
- **Personalized Mission Dashboard**: Time-based greeting ("Good morning/afternoon/evening, [User]"), live metrics queried strictly from database records, upcoming unlock countdown ticker, ready-to-open celebration cards, search and filter.
- **5-Stage Creation Studio**:
  1. *Type Selection*: Letter, Goal, Prediction, Memory, Custom.
  2. *Rich Composer*: Title, message editor, category tags, character/word counters, dynamic guided reflection prompts, automatic local draft preservation.
  3. *Memory Preservation*: Image uploads (JPEG, PNG, WebP) with custom captions.
  4. *Temporal Scheduling*: Horizon presets (1m, 6m, 1y, 3y, 5y), custom datetime-local selector with strict past-date rejection, explicit timezone mapping.
  5. *Preview & Sealing*: Detailed review with explicit modal confirmation before irreversible sealing.
- **Vault Archive**: Tabbed browsing (*All*, *Sealed*, *Ready to Open*, *Opened*), search by title/category, live countdown cards.
- **Opening Ceremony**: Server eligibility verification, subtle opening transition with celebratory confetti blast, revealed letter & memory photos, post-unlock reflection journaling.
- **Settings & Sovereignty**: Profile management, timezone preference, email notification toggle, GDPR JSON data export, and complete account deletion with cascade purge.

---

## 5. Development & Testing Setup

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v24)
- npm or pnpm

### Quick Start
```bash
# 1. Clone or navigate to the project directory
cd futureme-vault

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for local fallback mode)
cp .env.example .env.local

# 4. Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
The project includes a comprehensive Vitest unit and integration test suite:
```bash
npm test
```
**Test coverage encompasses:**
- UTC time-lock eligibility and past/future calculation logic (`src/lib/time/timezone.test.ts`)
- Ownership isolation and IDOR rejection (`src/lib/capsules/capsuleService.test.ts`)
- Pre-unlock content redaction and attachment filtering (`src/lib/capsules/capsuleService.test.ts`)
- Premature unsealing rejection (`src/lib/capsules/capsuleService.test.ts`)
- Post-unlock reflection restrictions (`src/lib/capsules/capsuleService.test.ts`)
- Notification idempotency and non-falsified delivery status (`src/lib/notifications/notificationService.test.ts`)
- Zod schema validations for forms, uploads, and dates (`src/lib/validations/capsule.test.ts`)
- API Route handler security and status codes (`src/app/api/capsules/[id]/route.test.ts`)

### Production Build
```bash
npm run build
npm start
```

---

## 6. External Service Configuration

### Supabase (Production Database & Auth)
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL schema script in `supabase/migrations/20261022000001_create_futureme_vault_schema.sql` via Supabase SQL Editor or Supabase CLI (`supabase db push`).
3. Set the following in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
*Note: If Supabase credentials are not configured, the application automatically uses its local high-fidelity persistence engine, ensuring zero crashes and 100% test pass rates in offline/demo environments.*

### Email Notifications (Optional)
To enable real email dispatch for unlock alerts:
1. Obtain an API key from [Resend](https://resend.com) or SendGrid.
2. Set `RESEND_API_KEY=re_...` in `.env.local`.
*If omitted, the notification service records scheduled deliveries as `pending` with explanatory audit logs, never falsifying provider responses.*
