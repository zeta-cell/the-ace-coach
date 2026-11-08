# AGENTS.md

## Rules

- Dashboard KPI figures use the shared `CountUp` and `SpotlightCard` components in `src/components/reactbits/`; never add a per-page number animator or a plain static stat tile. Why: one tween implementation keeps value formatting, reduced-motion handling and hover feedback identical across every dashboard instead of letting duplicate counters drift apart.
