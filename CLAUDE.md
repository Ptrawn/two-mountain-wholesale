# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Two Mountain Winery — Wholesale Sales CRM**
Owner: Patrick Rawn (patrick@twomountainwinery.com)

Internal tool for the winery's wholesale sales team. Tracks orders, manages wholesale accounts, generates invoices, and reports sales performance.

### Domain model

- **Customers**: wholesale accounts (store name, address, liquor license number, phone, email, contact name). Account type is either **on-premise** (bars/restaurants) or **off-premise** (retail stores).
- **Products**: wine SKUs with vintage, volume, ABV category (**over 14%** or **under 14%** — relevant for WA state licensing).
- **Orders / Sales records**: line items linking customers to products with quantity and price.
- **Invoices**: generated as PDFs; also supports attaching scanned handwritten invoices.
- **Prospects**: imported from state liquor license holder uploads (on-premise and off-premise lists).

### Key features

- Customer management CRUD
- Product catalog CRUD
- Order entry and sales records
- Invoice generation (PDF output + scanned attachment support)
- Sales dashboard: filter by customer, product, account type, and date range; period-over-period comparisons (current vs prior period and prior year)
- Live Google Sheets sync on every new order
- Reorder reminders based on last order date with dynamic per-customer cadence
- Prospect list management from state license uploads
- Historical data import via CSV

### Hosting

- **Frontend / API**: Vercel
- **Database**: Supabase (PostgreSQL) — credentials in `.env.local`

## Commands

```bash
npm run dev       # dev server (Turbopack by default)
npm run build     # production build (Turbopack by default; use --webpack to opt out)
npm run start     # production server
npm run lint      # ESLint (not run automatically by next build in v16+)
```

## Architecture

- **Framework**: Next.js 16.2.4 with App Router (`src/app/`)
- **React**: 19.2.4 — Server Components by default; add `'use client'` only for interactivity, browser APIs, or hooks
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`
- **Backend**: Supabase (`@supabase/supabase-js`). `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe for the client; `SUPABASE_SERVICE_ROLE_KEY` is server-only
- **Path alias**: `@/*` maps to `src/*`

## Key Next.js 16 API changes

**`params` and `searchParams` are Promises** — always `await` them:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

**Fetch is not cached by default.** Use the `use cache` directive (requires `cacheComponents: true` in `next.config.ts`) or `React.cache()` for memoization within a request.

**Server Functions** (previously Server Actions) use `'use server'`. To refresh the current page after a mutation use `refresh()` from `next/cache` (not `router.refresh()`). To invalidate cached data use `revalidatePath()` or `revalidateTag()`.

**Linting** is no longer run by `next build` — run `npm run lint` separately.

**Turbopack** is the default bundler. Webpack config is ignored unless you pass `--webpack`. Top-level `turbopack` key in `next.config.ts` (not `experimental.turbopack`).

**Route Handlers** live in `app/**/route.ts` and cannot coexist at the same segment as `page.ts`. They are not cached by default; opt in with `export const dynamic = 'force-static'` or `use cache`.
