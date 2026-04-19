# Project Memory

## Core
- English UI only. Use colored Lucide icons for all badges/status (no emojis).
- Category colors: emerald (tennis), cyan (padel), orange (fitness), purple (mental), green (recovery).
- RLS: Public read for coach profiles/packages/reviews, strict ownership for writes.
- DB: Unified 'PlanItem'/'DayPlan' structure. Auto-delete 'player_day_plans' if last item is removed.
- UX: 'Create Training' actions must always navigate directly to the full-page Training Builder (no drawers).
- Routing: RBAC redirects Admin -> `/founders`, Coach -> `/coach`, Player -> `/dashboard`, Club Manager -> `/club`.
- Charts: Recharts v3 requires explicit interface definitions for `payload`, `label` in tooltips/legends.
- Terminology: Use active coaching terms. 'Training Library' (not Modules), 'Create Training' (not Assign).

## Memories
- [Profile Metrics Syncing](mem://features/profiles) — DB triggers for coach sessions, KCAL calculations for players
- [Training Content Types](mem://features/training-content) — Supported content: native video, YouTube, coach demos for racket sports
- [Public Routes Navigation](mem://navigation/public-routes) — SEO-friendly coach profiles, sticky booking CTA
- [Reviews & Rating](mem://features/reviews) — 1-5 star peer reviews, gamified XP rewards
- [Access Control](mem://technical/access-control) — Public read/private write RLS patterns
- [Marketplace Features](mem://features/marketplace) — 'Any Coach Can Guide' logic and 15% platform fee
- [Session Intelligence](mem://features/training/session-intelligence) — Open-Meteo and Google Maps integration
- [Payment System](mem://features/bookings/payment-system) — Mock Stripe flow, 15% commission, payout tracking
- [Training Architecture](mem://technical/training-architecture) — PlanItem/DayPlan, order_index, block_id logic
- [Wallet & Referrals](mem://features/wallet-and-referrals) — €5 signups, €10 first booking, tier raffles
- [Health Device Integrations](mem://features/health-integration) — Garmin OAuth 1.0a HMAC-SHA1, Whoop, Oura, Polar
- [Recharts Types](mem://technical/recharts-compatibility) — Recharts v3 explicit interface definitions
- [Event Timeline](mem://features/events) — Integrated timeline with 1:1 bookings and events
- [Community Hub](mem://features/community) — Global leaderboard, achievements feed, trending programs
- [Investor Readiness Metrics](mem://business/investor-readiness-metrics) — 0-100 score based on retention, LTV/CAC, growth
- [Expansion Strategy](mem://business/expansion-strategy) — Geographic market taxonomy (Established to Supply Only)
- [Founders Auth](mem://technical/founders-dashboard-access) — 24-hour token for read-only dashboard access
- [Gamification Mechanics](mem://features/gamification-mechanics) — XP logic (Session +25, Book +50), 6 tiers, daily streak
- [Video Feedback Branding](mem://features/training/video-feedback-and-branding) — Threaded video feedback with XP rewards
- [Group Session Management](mem://features/bookings/group-session-management) — Minimum participants, spot-dot availability indicators
- [Pricing Strategies](mem://features/bookings/pricing-strategies) — Per-person vs dynamically split fixed-total pricing
- [Coach Calendar](mem://features/coach-experience/calendar-view) — Bookings vs Availability tabs, lazy-loading logic
- [Founders Analytics](mem://features/admin/founders-dashboard-analytics) — 13 steering metrics, viral coefficient
- [Player Dashboard Vis](mem://features/dashboards-visualization) — Improvement score, 5-tier heatmap, KCAL
- [Booking Waitlist](mem://features/bookings/waitlist-logic) — 24h window auto-offers for full group sessions
- [Test Environment](mem://testing/test-environment-and-credentials) — Seed data functions and demo passwords
- [Portal Access](mem://navigation/portal-access) — Entry point routing by user role
- [Sport Specific Content](mem://features/coach-experience/sport-specific-content) — Basis + Extension architecture for Tennis/Padel
- [Iconography](mem://style/iconography) — Use colored Lucide icons exclusively, no emojis
- [Terminology](mem://style/terminology) — Active terminology conventions
- [Category Auto-Sorting](mem://features/training/category-organization) — Methodology sort sequence (Warm-Up to Cool-Down)
- [Category Visuals](mem://style/category-visuals) — Specific hex/color names for categories
- [Creation Navigation](mem://features/coach-experience/creation-navigation-intent) — Full-page intent logic
- [Training Builder State](mem://technical/training-builder-state) — Staged items exploding blocks architecture
- [Mobile UX](mem://navigation/mobile-ux) — Fixed nav sequence and elevated CREATE button
- [Cancellation Policy](mem://features/player-experience/cancellation-policy) — 48h rules and dynamic badge colors
- [CRM Pipeline](mem://features/crm) — Lead-to-client kanban for coaches/clubs, auto-create on booking, convert-to-player
