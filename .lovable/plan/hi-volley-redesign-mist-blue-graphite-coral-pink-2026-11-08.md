# Hi Volley redesign: Mist Blue, Graphite, Coral Pink

## Direction
- Product: book and train with tennis and padel coaches, track your shots.
- Character: athletic, sharp, calm confidence.
- World: sports campaign posters (the circled "Move", "Run faster" and shoe tiles): cool mist blue light, graphite type, one coral stroke.
- Moments: hero photo with a cool mist-blue grade, and the Cosmic Player Card / shot development chart.
- Signature: a short coral underline bar (like "The game begins" in the reference), used under section labels and key numbers only.

## Palette (mist blue dominant)
- Mist Blue #CCDCEF is the main color: page background and most sections, with tone steps inside the same blue (#E3ECF7 raised cards, #B7CBE3 hairlines and pressed states). No hue gradients.
- Graphite #222526 for text and headings, plus at most one dark contrast band (for example the footer). Never the page background.
- Coral Pink #FF6574 as the single accent: primary button, active state, signature bar. Coral text uses a deeper #E04A5A so it stays readable on mist blue.
- Slate blue #5B7493 for secondary text.
- The whole app (public and portal) moves to this light mist-blue look. This replaces the earlier "dark from the start" rule; the memory gets updated.
- Old electric blue / cantaloupe gradients and glow backgrounds are removed.

## Unslop pass (whole app, public + portal)
Fixes exactly the slop in your second screenshot, everywhere:
- Uppercase heavy headings like "FIND YOUR COACH" become sentence case, medium weight
- Icon tiles on top of every card removed; icons small, inline, muted
- Six identical cards in a grid replaced with a varied layout (numbered list, or one wide item plus rows)
- Hype copy removed: "AI-powered plans", "your perfect match awaits", filler dashes
- Translucent cards over rainbow gradient removed; solid surfaces with hairline borders
- Unverified stats (500+ coaches, 10K+ sessions, 4.9) removed unless you confirm them
- Spacing on a 4px grid, one radius scale (8/12/16), tabular numbers, no glows, no looping animations
- Portal: dashboards, calendar, court board, profiles, analytics, coach pages get the same colors and a spacing/type/copy pass. Features and data stay.

## React Bits (reactbits.dev), used sparingly
Only where motion explains something, respecting reduced motion:
- Hero headline: Split Text / Blur Text reveal (one entrance)
- Stats and KPIs: Count Up
- Coach directory / feature list: Spotlight Card hover (subtle coral)
- Sections: Fade Content on scroll
- Player card: Tilted Card
No animated backgrounds (Aurora, Particles, Waves) since those would be new slop.

## Order
1. Colors + homepage (checked with screenshots)
2. Public pages (find a coach, coach profile, marketplace, sign in)
3. Portal: player, coach, club, admin

## Technical notes
- Update HSL tokens in src/index.css and tailwind.config.ts; switch default theme to light; fonts unchanged.
- Remove GradientBackdrop and AmbientBackground usage; delete unused gradient assets.
- React Bits components added as source (TS + Tailwind) under src/components/reactbits/, using the existing motion library; check React 18 compatibility.
- Update brand memory (palette, theme rule) after approval.
