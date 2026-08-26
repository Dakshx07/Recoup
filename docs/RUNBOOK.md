# Recoup — Operations & Demo Runbook

This runbook provides step-by-step instructions for installing dependencies, running database migrations, seeding the 200-case synthetic benchmark, executing automated tests, and demonstrating the product live to evaluators.

---

## 1. Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Supabase**: Active Supabase Project with PostgreSQL 15+
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## 2. Installation & Configuration

```bash
# 1. Clone repository
git clone https://github.com/Dakshx07/Recoup.git
cd Recoup

# 2. Install dependencies
npm install

# 3. Create local environment configuration
cp .env.example .env.local
```

Populate `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
GEMINI_API_KEY=your-gemini-api-key
CLOCK_MODE=DEMO
```

---

## 3. Database Migration & Synthetic Seeding

1. Execute the SQL migrations in `supabase/migrations/` in order (`0001` through `0006`) via the Supabase SQL Editor.
2. Run the single-pass instant simulation runner:
```bash
npm run simulate
```
*This populates 200 recovery cases, 180 debtor replies, 180 structured parses, 120 commitments, 80 payments, and 890 audit events in ~1.5 seconds.*

---

## 4. Running the Application

```bash
npm run dev
```
- **Marketing & Architecture Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Operations Dashboard Console**: [http://localhost:3000/app](http://localhost:3000/app)

---

## 5. Running Automated Verification Suites

```bash
# Run all 166 unit and policy engine tests
npm test

# Run strict TypeScript static typecheck
npm run typecheck
```

---

## 6. Recommended Evaluator Demo Script

### Step 1: Landing Page (`/`)
- Review the Fraunces headline: *"Every promise to pay, tracked, verified, and provable."*
- Inspect the 5-Stage Lifecycle Arc and the 2-Panel AI Boundary comparison.

### Step 2: Operations Console Overview (`/app`)
- Observe the **4-metric strip** showing ₹50.06L recovered (40.12% recovery rate across ₹1.24 Cr book).
- Inspect the **Needs Attention** queue prioritizing disputed and broken promise cases.

### Step 3: Deep Dive into Dispute Freeze (Case `INV-2101`)
- Navigate to `/app/cases` &rarr; click on **`INV-2101`** (*Olive Trading*).
- Inspect the **7-step causal timeline** demonstrating the arrival of the promise on Jan 3 followed by the dispute on Jan 5.
- Notice the **Frozen Commitment Card** showing ₹42,000 due Jan 10 (`is_frozen = true`, badge: `Frozen pending dispute determination`).
- In the **Human Override Panel**:
  1. Select *"Reject dispute — resume commitment"* or *"Uphold dispute — void commitment"*.
  2. Enter mandatory reviewer justification.
  3. Click *"Apply Override Decision"* and confirm.
  4. Observe instant state update and the newly appended **Event #8** in the audit log with real UTC wall-clock attribution.

### Step 4: Live Evaluation & Policy Rules (`/app/evaluation` & `/app/policy`)
- Review the live model activity logs and 13 locked policy rules imported directly from `config.ts`.
