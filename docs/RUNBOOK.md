# Runbook

> Exact commands: install, migrate, seed synthetic data, run evaluation, run the demo sequence.

_Last updated: 2026-08-24 (scaffold — will be filled as each step is built)._

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- A Supabase project (free tier works)
- A Google Gemini API key

## 1. Clone and Install

```bash
git clone https://github.com/Dakshx07/Recoup.git
cd Recoup
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your Supabase and Gemini credentials. See `.env.example` for required variables.

## 3. Run Database Migrations

_Commands to be added at build-order step 1._

## 4. Seed Synthetic Data

_Commands to be added at build-order step 4._

## 5. Run Evaluation

_Commands to be added at build-order step 12._

## 6. Run the Demo

_Commands to be added at build-order step 14._

## 7. Run Tests

```bash
npm test           # unit tests
npm run typecheck   # TypeScript strict mode check
```
