<div align="center">

<img src="src/assets/logo.png" alt="Hotel Kamala Inn Grand" width="88" />

# Hotel Kamala Inn Grand

**A dual portal hotel management platform** — guest facing marketing/booking site
+ full back office admin console.

[![Live Site](https://img.shields.io/badge/live-kamalainngrand.com-c9a84c?style=for-the-badge)](https://kamalainngrand.com)
&nbsp;
![React](https://img.shields.io/badge/React_19-0f1e3c?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-0f1e3c?style=for-the-badge&logo=typescript&logoColor=3178C6)
![Supabase](https://img.shields.io/badge/Supabase-0f1e3c?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-0f1e3c?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)

📍 NH28 Bypass Road, Padrauna, Kushinagar District, Uttar Pradesh - 274304

</div>

<br />

## Overview

The platform has two halves that share one Supabase project:

| | |
| --- | --- |
|**Guest portal** | Public marketing homepage with an availability/booking enquiry form that writes directly into the database |
|**Admin console** (`/admin`) | Role-gated back office for running the front desk day to day — enquiries, walk-in bookings, a live room map, an availability calendar, a master reservations ledger with billing and receipts, room-rate management, and a permanent audit trail |

<br />

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 · TypeScript · Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | Supabase (Postgres · Auth · Realtime) |
| Icons | lucide-react |
| Linting | oxlint |

<br />

## Getting Started

**Prerequisites:** Node.js 18+ and a Supabase project (free tier is sufficient).

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase project's credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> Apply every file in `supabase/migrations/` **in order** against your Supabase project (SQL editor or Supabase CLI) — each migration is additive and numbered, so don't skip any.

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

<br />

## Project Structure

```
src/
├─ features/public/    Guest-facing homepage sections (hero, rooms, booking form, ...)
├─ pages/public/        Guest-facing route entry points
├─ pages/admin/         Admin console pages (Dashboard, Ledger, RoomMap, ...)
├─ components/          Shared layout and auth-guard components
├─ context/             AuthContext (session/role), SystemContext (branding/config)
├─ lib/                 Supabase client + data-access helpers, one module per domain
└─ types/database.ts    Hand-maintained Supabase schema types

supabase/migrations/    Numbered, ordered SQL migrations — the source of truth for schema
```

<br />

## Database

The schema lives entirely in `supabase/migrations/`, applied sequentially.

| Table | Purpose |
| --- | --- |
| `room_categories` / `physical_rooms` | Sellable room types and the numbered rooms mapped to them |
| `enquiries` | Guest booking requests submitted from the public site |
| `reservations` | Confirmed bookings — the operational and financial source of truth (status, occupancy, billing, payment tracking) |
| `system_configurations` | Singleton row driving branding, booking rules, and invoice configuration |
| `staff_roles` | Three-tier admin role hierarchy (`master_admin`, `head_admin`, `sub_admin`) |
| `audit_logs` | Append-only record of every significant administrative action |

All tables are protected by Postgres row-level security. Public/anon access is limited to reading sellable room data and inserting enquiries; every other table requires an authenticated staff session, and some (like room-rate edits) are further restricted by role at the database level, not just in the UI.

<br />

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

| Role | Access |
| --- | --- |
| **Master Admin** | Full access; exactly one account permitted |
| **Head Admin** | Full front-desk and rate access; can manage Sub Admin accounts |
| **Sub Admin** | Operational access with restricted/read-only views on rate and settings screens |

### Live data & Realtime

Room rates, the room map, the availability calendar, and dashboard stats all subscribe to Supabase Realtime `postgres_changes` events, so a change made in one browser tab (or by another staff member) reflects everywhere within seconds — no manual refresh required.

### Audit trail

Every meaningful mutation (bookings created, ledger edits, rate changes, check-ins/outs, cancellations) is recorded to `audit_logs` via a centralized `logAction()` helper and reviewable in Settings → Audit Log by Head/Master Admin accounts.

<br />

## Known Gaps

This is an actively evolving project:

- The guest-facing room showcase (`RoomsSection.tsx`) still renders from a static placeholder list rather than the live `room_categories` table.
- The branding/content customizer (color theme, image uploads, editable site copy, booking-rule configuration) hasn't been built yet — site branding is currently only editable directly in the database.
