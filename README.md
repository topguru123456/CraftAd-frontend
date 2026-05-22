# CraftAd

Production-grade React + Vite + Tailwind scaffold themed to the CraftAd brand (RTL Hebrew, pink/coral gradient, navy ink).

## Stack
- **React 18** + **Vite 5** (fast HMR, ESM-native)
- **Tailwind CSS 3** with a fully tokenized design system
- **React Router v6** with public/protected route guards
- **React Hook Form + Zod** for type-safe form validation
- **TanStack Query** for server state
- **Axios** with interceptors for the HTTP layer
- **Zustand** ready for global UI state

## Structure

```
src/
  assets/        Static images, icons, fonts
  components/    Reusable UI primitives (ui/, layout/, feedback/, form/)
  config/        env, routes, site metadata
  constants/     API endpoints, message keys
  contexts/      React Contexts (Auth, Theme)
  features/      Feature-sliced modules (auth, dashboard, ...)
  hooks/         Cross-feature hooks
  layouts/       AuthLayout, AppLayout, BlankLayout
  lib/           http client, query client, cn helper
  locales/       i18n resources
  pages/         Route components
  router/        Route definitions and guards
  services/      Browser services (storage, analytics)
  styles/        globals.css
  utils/         Pure helpers
```

## Path Aliases
`@`, `@components`, `@features`, `@layouts`, `@lib`, `@hooks`, `@config`, `@utils`, `@assets`

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Backend (Supabase)

The schema lives in `supabase/migrations/` as versioned SQL. Edge Functions live in `supabase/functions/`. See [`supabase/README.md`](./supabase/README.md) for:

- Applying migrations to a fresh project (Dashboard SQL Editor or Supabase CLI)
- Day-to-day workflow for adding new schema files
- Step-by-step for spinning up a production project from scratch
- Migrating data between projects
- What's portable if you ever leave Supabase
