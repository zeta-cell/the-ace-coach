# Hi Volley redesign: Graphite, Mist Blue, Coral Pink

## Direction
- Product: book and train with tennis and padel coaches, track your shots.
- Character: athletic, sharp, calm confidence.
- World: sports campaign posters (reference image): graphite and navy panels, mist blue light, one coral stroke.
- Moments: hero photo and the Cosmic Player Card / shot development chart.
- Signature: a short coral underline bar (like "THE GAME BEGINS" in the reference), used under section labels and key numbers only.

## Palette (replaces electric blue / cantaloupe)
- Graphite #222526 — surfaces of dark sections, cards, sidebar (replaces "no black" rule: graphite is a warm charcoal, not black; confirm)
- Deep navy #1B2433 — page background (from the dark poster tiles)
- Mist Blue #CCDCEF — light sections, secondary text on dark, light poster-style panels
- Coral Pink #FF6574 — single accent: primary button, active state, signature bar
- White for primary text
- Old blue/orange gradients and glow backdrops removed. Sections alternate: navy, mist blue (dark text), graphite, like the poster grid.

## Unslop pass (whole app, public + portal)
Fixes exactly the slop in your second screenshot, everywhere:
- Uppercase, heavy headings like "FIND YOUR COACH" become sentence case, medium weight
- Icon tiles (icon in a rounded square on top of every card) removed; icons inline, small, muted
- Six identical cards in a grid replaced with a varied layout (list with numbers / one wide + rows)
- Hype copy removed: "AI-powered plans", "your perfect match awaits", em-dash filler
- Translucent cards over rainbow gradient removed; solid surfaces with hairline borders
- Unverified stats (500+ coaches, 10K+ sessions, 4.9) removed unless you confirm them
- Spacing on 4px grid, one radius scale (8/12/16), tabular numbers, no glows, no looping animations
- Portal: dashboards, calendar, court board, profiles, analytics, coach pages get the same tokens and a spacing/type/copy pass. Features and data stay.

## React Bits (reactbits.dev), used sparingly
Only where motion explains something, respecting reduced motion:
- Hero headline: Split Text / Blur Text reveal (one entrance)
- Stats and KPIs: Count Up
- Coach directory / feature list: Spotlight Card hover (coral, subtle)
- Section transitions: Fade Content on scroll
- Player card: Tilted Card
No backgrounds like Aurora/Particles/Waves (that would be new slop).

## Order
1. Tokens + homepage (verify with screenshots)
2. Public pages (find a coach, coach profile, marketplace, auth)
3. Portal: player, coach, club, admin

## Technical notes
- Update HSL tokens in src/index.css and tailwind.config.ts; fonts unchanged.
- Remove GradientBackdrop and AmbientBackground usage; delete unused gradient assets.
- React Bits components copied as source (TS + Tailwind variants) into src/components/reactbits/, using the existing motion library; check React 18 compatibility.
- Update the brand memory (palette, no-black rule) after approval.
