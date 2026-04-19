---
name: CRM Pipeline
description: Lead-to-client kanban pipeline for coaches and clubs with auto-create on booking and convert-to-player flow.
type: feature
---
Tables: `crm_clients` (owner_id + owner_type 'coach'|'club', pipeline_stage, lifetime_value, linked_user_id), `crm_activities` (timeline log), `crm_pipeline_stages` (customizable kanban columns).

Default stages auto-seeded via `seed_default_crm_stages` RPC: Lead → Contacted → Trial Booked → Active Client → Churned.

Routes: `/coach/crm` and `/club/crm`. Hook `useCrmOwner` resolves owner_id+owner_type from auth/active club.

Auto-create: trigger `auto_create_crm_client_from_booking` inserts a CRM client for the coach when a player makes their first booking.

Convert-to-Player: looks up profile by email, inserts `coach_player_assignments`, sets `linked_user_id` and bumps stage to 'active'.

Kanban supports drag-drop between stages. List view also available.
