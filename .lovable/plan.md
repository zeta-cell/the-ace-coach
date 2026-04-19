

Phase 1 + 2 are already shipped. Now planning the next batch based on the user's earlier answers.

**Recommended next: Phase 5a → Phase 3 → Phase 4 → Phase 5b**
(Calendar/library port first so Club Mode + CRM build on the optimized foundation; emails last to unlock invites.)

---

# Phase 5a — Port Optimized Calendar + Module Library from Ace Academy

**Goal:** Replace `CoachCalendar.tsx` with the Ace Academy version and seed a richer module library + training blocks.

**Steps**
1. Cross-read Ace Academy's `src/pages/portal/CoachCalendar.tsx`, calendar sub-components, and module/block seed data.
2. Port calendar UI (Bookings ↔ Availability tabs, lazy-loading, drag-to-create slots) restyled to ACE Coach tokens.
3. New edge function `seed-from-ace-academy` → inserts modules + `training_blocks` (idempotent, skips existing titles).
4. Add admin button on `/founders` to trigger the seed.

---

# Phase 3 — Club Mode (Multi-Coach Org)

**DB migration**
- New enum value `club_manager` on `app_role`.
- Tables: `clubs`, `club_coaches` (with role: owner/manager/coach), `club_courts`, `club_invites` (email + token + expires_at).
- `bookings` + `events`: nullable `club_id` + `court_id` FKs.
- Helper function `is_club_manager(_user_id, _club_id)` (SECURITY DEFINER) to prevent recursive RLS.
- RLS: club managers can read/manage bookings, packages, availability of any coach in `club_coaches` for their club.

**Routing**
- Login redirect: `club_manager` → `/club`.
- New portal section `/club/*` with bottom-nav variant for mobile.

**New pages**
- `ClubDashboard.tsx` — KPIs across all coaches (revenue, sessions, court occupancy %).
- `ClubBookings.tsx` — unified calendar; manager picks court at booking (per user's choice).
- `ClubCoaches.tsx` — roster + dual onboarding: (a) **invite by email** (creates `club_invites` row, email sent in Phase 5b — for now, copyable invite link), (b) **link existing coach** by email lookup → instant join.
- `ClubCourts.tsx` — court inventory, surface, indoor/outdoor, conflict detection.
- `ClubSettings.tsx` — name, logo, address, contact email.

**Court allocation in existing booking flows**
- `BookCoach`, `CreateEventDrawer`, `AssignBlockToPlayerDialog` → if coach belongs to a club, replace free-text "Court #" with a dropdown of `club_courts`. Auto-block conflicts at the same date/time.

---

# Phase 4 — CRM (Coach + Club, Full Scope)

**DB migration**
- `crm_clients` (owner_id, owner_type 'coach'|'club', full_name, email, phone, source, status, pipeline_stage, lifetime_value, tags[], notes, last_contact_at, linked_user_id nullable).
- `crm_activities` (client_id, type, body, created_by, created_at).
- `crm_pipeline_stages` (owner_id, owner_type, name, order_index, color) — seeded with default stages: Lead → Contacted → Trial Booked → Active Client → Churned.
- RLS: owners (coach or club managers) read/manage their own clients + activities.

**UI (port from Ace Academy `src/components/crm/`, restyled)**
- `/coach/crm` and `/club/crm` routes.
- `CrmPipeline.tsx` (Kanban) + `CrmListView.tsx` (table) + stat cards (total clients, active, LTV, pipeline value).
- `ClientDetailDrawer.tsx` — activity timeline, tags, notes, "Convert to Player" → links `linked_user_id` and inserts `coach_player_assignment`.
- `NewClientDialog.tsx` + import flows (CSV + WhatsApp ZIP from Ace Academy).
- Auto-create CRM client on first booking from a new email (post-conversion management).

---

# Phase 5b — Email Infrastructure

**Setup**
- Set up Lovable Emails sender domain (will prompt user when reached).

**Edge functions to port**
- `auth-email-hook` — branded signup/reset/magic-link emails.
- `invite-player` — coach invites a player by email.
- `invite-club-coach` — club manager invites a coach (consumes `club_invites` token from Phase 3).
- `send-transactional-email` + `process-email-queue` — queued sender.
- `handle-email-suppression` + `handle-email-unsubscribe` — compliance.

**Wire-up**
- `ClubCoaches.tsx` invite flow switches from copy-link to actual email.
- New booking confirmation triggers transactional email with court # + check-in code (Phase 1 data).

---

## Execution order

```text
5a  Calendar + module library port           ~1-2 messages
3   Club Mode (DB + portal + court picker)   ~2-3 messages
4   CRM port (DB + Kanban + detail drawer)   ~2 messages
5b  Email domain + 5 edge functions          ~1-2 messages
```

Reply with which phase to start, or just "go" to begin Phase 5a.

