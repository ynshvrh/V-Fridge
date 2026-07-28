# 🧊 V-Fridge

**V-Fridge** is an AI-powered smart fridge tracker, meal planner, and calorie management application. Track your inventory, monitor expiration dates, scan product barcodes, plan weekly meals, log calories, and chat with an AI Chef to create delicious recipes from available ingredients.

> 🚀 **Primary Client:** The application frontend has been fully migrated to **Vue 3 + Vite (`vue-platform`)**, featuring a consolidated Hub-based navigation, mobile-first responsive design, camera barcode scanner, and clean Light/Dark theme switching. The legacy Next.js client (`web-platform`) is archived.

The backend service lives in [`v-fridge-api`](https://github.com/ynshvrh/v-fridge-api) (ASP.NET Core 10 Minimal API + PostgreSQL).

---

## 🌟 Key Features

* **🧊 Storage Hub (`/`)** — Consolidated 3-in-1 management hub:
  * **Inventory:** Track products with quantities, units, categories, and expiration status badges (`Fresh`, `Expiring Soon`, `Expired`).
  * **Shopping List:** Add items manually or auto-replenish from inventory; check off items and move them to your fridge in one click.
  * **Shared Fridges:** Create household fridges, switch active fridges, manage roles (`Owner` / `Member`), and generate invite tokens.
* **🍳 Culinary Hub (`/recipes`)** — Consolidated 3-in-1 cooking workspace:
  * **AI Chef Chat:** Real-time recipe generation powered by OpenRouter grounded in your fridge inventory and dietary profile.
  * **Weekly Meal Planner:** Generate weekly meal plans (Breakfast, Lunch, Dinner), calculate missing ingredients ("gaps"), and import them to your shopping list.
  * **Saved Recipes:** Bookmark favorite recipes, inspect KBJV macro breakdowns, and log meals directly to your Calorie Tracker.
* **📊 Calorie & Macro Tracker (`/nutrition`)** — Set daily calorie, protein, fat, and carb targets; track food logs by date; auto-decrement consumed quantities from your fridge.
* **📷 Camera Barcode Scanner** — Built-in camera scanner using `@zxing/library` connected to the **OpenFoodFacts API** to automatically look up product names, categories, and weights.
* **📱 Mobile-First Responsive UI** — Touch-optimized 44px+ touch targets, off-canvas mobile drawer, and seamless scaling from 320px smartphones to 4K displays.
* **🎨 Themes & Customization** — Light & Dark modes aligned with the Citrus design system palette, **Ambient Glow** toggle, **High Contrast** mode, and shopping list interaction modes.
* **🔑 Deep-Link Invites & Email Verification** — Secure JWT authentication with single-flight refresh, email verification workflow, and deep-link token invite acceptance (`/invite?token=...`).

---

## 🛠️ Tech Stack (`vue-platform`)

* **Framework:** Vue 3 (Composition API + `<script setup>`)
* **Build Tool:** Vite 6
* **State Management:** Pinia
* **Routing:** Vue Router 4
* **Barcode Scanner:** `@zxing/library` + OpenFoodFacts API
* **Icons:** `@lucide/vue`
* **Styling:** Vanilla CSS design system with CSS custom properties, glassmorphism tokens, and responsive media queries
* **Auth & API Client:** Custom fetch client with JWT token storage, single-flight refresh, and error handling in `src/api/client.ts`
* **Backend API:** ASP.NET Core 10 Minimal API + PostgreSQL (see [`v-fridge-api`](https://github.com/ynshvrh/v-fridge-api))

---

## 💻 Local Development

```bash
# Clone repository
git clone https://github.com/ynshvrh/V-Fridge.git
cd V-Fridge/vue-platform

# Install dependencies
npm install
```

Create `vue-platform/.env` (optional, defaults to `http://localhost:5080`):

```env
VITE_API_URL=http://localhost:5080
```

Start the Vite development server:

```bash
npm run dev
```

### Useful Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Vite dev server with Hot Module Replacement (HMR) |
| `npm run build` | Run TypeScript type-checker (`vue-tsc`) & production bundle build |
| `npm run preview` | Preview production build locally |

---

## 📂 Repository Layout

```
V-Fridge/
├── vue-platform/             # Active Primary Vue 3 + Vite SPA
│   ├── src/
│   │   ├── api/             # HTTP API Client & types
│   │   ├── assets/          # Global CSS tokens & main.css
│   │   ├── components/      # Modular UI components
│   │   │   ├── chat/        # AI Chef Chat components
│   │   │   ├── fridge/      # Fridge selector, product cards, modals, Fridges tab
│   │   │   ├── layout/      # Navbar & responsive mobile drawer
│   │   │   ├── planner/     # Meal cards, gap items & Planner tab
│   │   │   ├── products/    # BarcodeScannerModal
│   │   │   └── shopping/    # Shopping rows & Shopping tab
│   │   ├── router/          # Vue Router routes & auth guards
│   │   ├── stores/          # Pinia stores (auth, fridge, product, nutrition, etc.)
│   │   └── views/           # Consolidated Hub views (Dashboard, Recipe, Nutrition, Settings, Invite)
│   ├── package.json
│   └── vite.config.ts
└── web-platform/            # Legacy Next.js client (Archived)
```
