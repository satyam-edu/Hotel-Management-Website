# Hotel Kamala Inn Grand

A dual-portal hotel management platform: a guest-facing marketing/booking site and a full back-office admin console, built on React, TypeScript, and Supabase.

NH-28 Bypass Road, Padrauna, Kushinagar District, Uttar Pradesh — 274304

## Overview

The platform has two halves that share one Supabase project:

- **Guest portal** — a public marketing homepage with an availability/booking enquiry form that writes directly into the database.
- **Admin console** (`/admin`) — a role-gated back office for running the front desk day to day: enquiries, walk-in bookings, a live room map, an availability calendar, a master reservations ledger with billing and receipts, room-rate management, and a permanent audit trail.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | Supabase (Postgres, Auth, Realtime) |
| Icons | lucide-react |
| Linting | oxlint |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is sufficient)

### Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase project's credentials:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Apply the database schema by running every file in `supabase/migrations/` **in order** against your Supabase project (via the SQL editor or the Supabase CLI). Each migration is additive and numbered — do not skip any.

Then start the dev server:

```bash
npm run dev
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build |
| `npm run lint` | Run oxlint across `src/` |
| `npm run preview` | Preview a production build locally |

## Project Structure

```
src/
  features/public/     Guest-facing homepage sections (hero, rooms, booking form, ...)
  pages/public/         Guest-facing route entry points
  pages/admin/          Admin console pages (Dashboard, Ledger, RoomMap, ...)
  components/           Shared layout and auth-guard components
  context/               AuthContext (session/role), SystemContext (branding/config)
  lib/                    Supabase client + data-access helpers, one module per domain
  types/database.ts       Hand-maintained Supabase schema types

supabase/migrations/    Numbered, ordered SQL migrations — the source of truth for schema
```

## Database

The schema is defined entirely in `supabase/migrations/`, applied sequentially. Key tables:

- `room_categories` / `physical_rooms` — sellable room types and the numbered rooms mapped to them.
- `enquiries` — guest booking requests submitted from the public site.
- `reservations` — confirmed bookings; the operational and financial source of truth (status, occupancy, billing, payment tracking).
- `system_configurations` — a singleton row driving branding, booking rules, and invoice configuration.
- `staff_roles` — the three-tier admin role hierarchy (`master_admin`, `head_admin`, `sub_admin`).
- `audit_logs` — an append-only record of every significant administrative action.

All tables are protected by Postgres row-level security. Public/anon access is limited to reading sellable room data and inserting enquiries; every other table requires an authenticated staff session, and some (like room-rate edits) are further restricted by role at the database level, not just in the UI.

## Admin Console

Reached at `/admin`, gated by Supabase Auth session and a `staff_roles` role lookup.

| Route | Purpose |
| --- | --- |
| `/admin/dashboard` | Live occupancy/arrivals/departures stats and room-rate management |
| `/admin/enquiries` | Review and convert guest booking enquiries |
| `/admin/front-desk` | Today's arrivals/departures, walk-in booking intake |
| `/admin/room-map` | Interactive floor-by-floor room grid with live status |
| `/admin/availability-calendar` | Month-view booking grid across all rooms |
| `/admin/ledger` | Master reservations ledger — filtering, editing, receipts, CSV export |
| `/admin/settings` | Staff management and the system audit log (Head/Master Admin only) |

### Role hierarchy

- **Master Admin** — full access, exactly one account permitted.
- **Head Admin** — full front-desk and rate access, can manage Sub Admin accounts.
- **Sub Admin** — operational access with restricted/read-only views on rate and settings screens.

### Live data & Realtime

Room rates, the room map, the availability calendar, and dashboard stats all subscribe to Supabase Realtime `postgres_changes` events, so a change made in one browser tab (or by another staff member) reflects everywhere within seconds — no manual refresh required.

### Audit trail

Every meaningful mutation (bookings created, ledger edits, rate changes, check-ins/outs, cancellations) is recorded to `audit_logs` via a centralized `logAction()` helper and reviewable in Settings → Audit Log by Head/Master Admin accounts.

## Known Gaps

This is an actively evolving project. At present, the guest-facing room showcase (`RoomsSection.tsx`) still renders from a static placeholder list rather than the live `room_categories` table, and the full branding/content customizer (color theme, image uploads, editable site copy, booking-rule configuration) has not yet been built — site branding is currently only editable directly in the database.
