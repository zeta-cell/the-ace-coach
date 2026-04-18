

# Club Mode + CRM + Court Numbers + Module Descriptions + Cross-Project Sync

This is a large strategic addition. I'll break it into 5 cohesive phases — each independently shippable. Approve the plan and tell me which phase to start with.

---

## Phase 1 — Session Logistics (court number, instructions, check-in code)

Smallest, highest-value layer. Affects every existing booking/training session today.

**DB schema (new columns)**
- `bookings`: `court_number text`, `arrival_instructions text`, `check_in_code text` (auto-generated 6-char), `coach_name_for_arrival text`
- `player_day_plans`: `court_number text`, `arrival_instructions text`
- `events`: `court_number text`, `arrival_instructions text`

**UI**
- `CreateEventDrawer`, `AssignBlockToPlayerDialog`, `BookCoach` flow → add "Court #" + "Arrival instructions" fields
- `UpcomingBookings`, `UpcomingSchedule`, `BookingSuccess` → court badge + collapsible "How to find us" panel showing check-in code (e.g. *"Court 4 · Say: 'I'm here for Valdez coaching' · Code: A7B2X9"*)

---

## Phase 2 — Module Descriptions Visible to Both Sides

**DB**
- `modules` already has `description` + `instructions`. Add: `player_description text` (what the player sees) + `coach_description text` (coaching cues, key focus points)

**UI**
- Module/training-block cards across Training, CoachPlayerDetail, PlayerProfile → `<Collapsible>` dropdown per module with Player view / Coach view tabs
- Edit forms in `CoachModules.tsx` get the two new fields

---

## Phase 3 — Club Mode (Multi-Coach Organization)

The biggest piece. A "Club" owns multiple coaches and centrally manages their bookings, courts, and CRM.

**DB schema**
```text
clubs            (id, name, slug, logo_url, address, city, country,
                  courts_count, contact_email, owner_id)
club_coaches     (club_id, coach_id, role: 'owner'|'manager'|'coach')
club_courts      (id, club_id, court_number, surface, indoor bool, notes)
```
- `bookings` gets nullable `club_id` + `court_id` FK
- New `app_role` value: `club_manager`
- RLS: club managers can read/manage `bookings`, `coach_packages`, `coach_availability_slots` of coaches in their club

**Routing & navigation**
- Role redirect: `club_manager` → `/club`
- New portal `/club/*`: Dashboard, Coaches, Bookings (centralized calendar), Courts, CRM, Settings

**Key new pages** (mirroring `/coach/*` patterns):
- `ClubDashboard.tsx` — KPIs across all coaches (revenue, sessions, occupancy)
- `ClubBookings.tsx` — unified calendar with court allocation, drag-to-reassign coach
- `ClubCoaches.tsx` — roster, invite via email, performance per coach
- `ClubCourts.tsx` — court inventory + conflict detection

---

## Phase 4 — CRM (Coach + Club)

Cross-referenced from Ace Academy's `src/components/crm/` (ClientCard, CrmPipeline, CrmListView, ClientDetailPanel, NewClientDialog, SendEmailDialog, WhatsAppZipImportDialog).

**DB**
```text
crm_clients      (id, owner_id, owner_type: 'coach'|'club',
                  full_name, email, phone, source, status,
                  pipeline_stage, lifetime_value, tags[],
                  notes, last_contact_at, linked_user_id nullable)
crm_activities   (id, client_id, type: 'note'|'email'|'call'|'whatsapp'|
                  'session', body, created_by, created_at)
crm_pipeline_stages (id, owner_id, owner_type, name, order_index, color)
```

**UI** — port the components from Ace Academy, restyled to ACE Coach tokens:
- `/coach/crm` and `/club/crm` — Kanban pipeline + list view + stat cards
- Client detail drawer with activity timeline
- "Convert to player" → links `crm_clients.linked_user_id` and creates `coach_player_assignment`

---

## Phase 5 — Cross-Project Sync from Ace Academy

Pull these directly from the Ace Academy project:

1. **Module library + training blocks** — copy seed data via a new `seed-from-ace-academy` edge function inserting into `modules` + `training_blocks`
2. **Email infrastructure** — port: `auth-email-hook` (branded auth emails), `invite-player` (email invites), `send-transactional-email` + `process-email-queue`, `handle-email-suppression` + `handle-email-unsubscribe`. Uses Lovable's built-in email infra (will set up the sender domain when we get to this phase)
3. **Calendar UX** — replace `CoachCalendar.tsx` with the optimized version from Ace Academy

---

## Suggested execution order

```text
Phase 1 (court + instructions)   →  ~1 message, low risk, immediate value
Phase 2 (module descriptions)    →  ~1 message
Phase 5a (calendar + modules)    →  port optimized calendar, seed library
Phase 5b (emails)                →  Lovable Emails domain + 4 edge functions
Phase 3 (Club mode)              →  largest, ~2-3 messages
Phase 4 (CRM)                    →  port Ace Academy CRM, ~2 messages
```

---

## Open questions before we start

1. **Where to start?** Recommended: Phase 1 + 2 together (quick wins), then Phase 5a (port the optimized calendar + module library), then Club Mode, then CRM, then emails.
2. **Club coach onboarding** — email invites (needs Phase 5b first) or manual link by email lookup (works today)?
3. **Court allocation** — auto-assign first free court, manager picks at booking, or player picks?
4. **CRM scope** — lead pipeline (prospects), client management (existing players), or both?

Reply with which phase to start + answers to any questions and I'll implement.

