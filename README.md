# V-Fridge

**V-Fridge** is an AI-powered fridge tracker. Add the groceries you have, watch expiry dates, and ask the AI chef for a recipe that uses what is already in your fridge.

This repository holds the Next.js single-page client. The backend lives in a separate repo, [`v-fridge-api`](https://github.com/ynshvrh/v-fridge-api), and exposes a public stateless JSON API that this SPA (and, later, a Flutter mobile client) consumes.

---

## Features

* **AI Chef** — recipe suggestions powered by OpenRouter, grounded in the user's current inventory.
* **Inventory** — products with quantity, unit, and expiry date; dashboard surfaces what is expiring soon vs already expired.
* **Self-clearing chat history** — the assistant drops anything older than 24 hours so the prompt stays focused.
* **Server-side rate limiting** — the API enforces 5 chat requests per 60 s per user.
* **Email verification** — accounts are unusable until the verification link is clicked.

## Tech stack

* **Framework:** Next.js 16 (App Router) on React 19
* **State:** Zustand
* **Styling:** Tailwind CSS v4 + shadcn-style primitives + lucide-react icons
* **Validation:** Zod
* **Auth:** Bearer JWT stored in `localStorage`, single-flight refresh in `lib/api-client.ts` (no cookies, no NextAuth)
* **Backend API:** see [`v-fridge-api`](https://github.com/ynshvrh/v-fridge-api) — ASP.NET Core 10 Minimal API + PostgreSQL, schema in C# migrations
* **AI:** OpenRouter (configured on the API side)

## Local development

```bash
git clone https://github.com/ynshvrh/V-Fridge.git
cd V-Fridge/web-platform
npm install
```

Create `web-platform/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5080
```

Point it at a running [`v-fridge-api`](https://github.com/ynshvrh/v-fridge-api) instance (defaults to `http://localhost:5080`) and start the dev server:

```bash
npm run dev
```

Useful scripts:

| Command         | Description                                      |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Next.js dev server with HMR                      |
| `npm run build` | Production build                                 |
| `npm run start` | Run the production build                         |
| `npm run lint`  | ESLint (Next.js + react-hooks rules, no errors)  |

TypeScript is checked at build time; run `npx tsc --noEmit` for a standalone type-check.

## Repository layout

```
V-Fridge/
└── web-platform/
    ├── app/             # Next.js App Router pages
    ├── components/      # Reusable UI primitives (shadcn-style)
    ├── hooks/           # React hooks
    ├── interfaces/      # Shared TypeScript types / Zod schemas
    ├── lib/             # api-client, utils
    ├── providers/       # AuthProvider, etc.
    └── store/           # Zustand stores
```

## Notes

* All UI copy, log lines, and server payloads are in English; the client may eventually layer i18n on top of the API responses.
* The fridge database schema is owned by the C# API (see `v-fridge-api/src/VFridge.Api/Migrations`). This repo no longer carries Drizzle, NextAuth, Upstash, Neon-specific helpers, or Gemini SDKs.
