# Design System — Profound AI Marketing Pipeline

## Product Context
- **What this is:** An AI-powered marketing content pipeline dashboard — jobs queue, pipeline monitoring, content management, analytics, AI orchestration controls, and settings
- **Who it's for:** Profound AI's internal team — power users who live in this tool 8 hours a day
- **Space/industry:** AI marketing automation / content pipeline tooling
- **Project type:** Internal web app / dashboard

## Aesthetic Direction
- **Direction:** Precision Instrument
- **Decoration level:** Intentional — structure and color do the decorative work; no gratuitous ornamentation
- **Mood:** A well-funded research station, not a SaaS landing page. The feel of a darkroom or laboratory at work — warm, precise, quietly authoritative. Users should feel like they're operating a serious instrument, not filling out a form.
- **Anti-patterns explicitly avoided:** Purple/indigo accents, cold dark backgrounds, aurora mesh gradients, gradient headline text, generic icon grids, Inter as the only typeface, spinner-with-percentage progress bars

## Typography

- **Display/Section Headers:** Instrument Serif — an unexpected editorial serif in a data-heavy tool. Signals depth and intentionality. Pairs against monospace data to create instrument-meets-editorial tension that earns the name "Profound."
- **UI/Labels/Body:** Geist — purpose-built for dashboards, supports `tabular-nums` natively, optical size works from 11px to 24px without losing character
- **Data/Metrics/Timestamps:** DM Mono — teletype precision. Every number, job ID, latency, and token count feels like it was measured, not guessed
- **Code/CLI output:** JetBrains Mono — readable at 12px, clear zero/O disambiguation
- **Loading:** Google Fonts CDN for Instrument Serif, Geist, and DM Mono; JetBrains Mono via self-host or CDN

### Type Scale (4px base, modular 1.25)
```
xs:    11px / 1.4  — timestamps, meta labels
sm:    13px / 1.5  — table data, secondary labels
base:  15px / 1.6  — body, descriptions
md:    18px / 1.4  — card titles, sub-headers
lg:    22px / 1.3  — page section headers (Instrument Serif)
xl:    28px / 1.2  — page titles (Instrument Serif)
2xl:   36px / 1.1  — hero/display (Instrument Serif, rare)
```

## Color

- **Approach:** Semantic — color carries meaning, not decoration. Amber means active. Teal means done. The user reads system state from color, not icons alone.

### Base Palette
```
--bg:           #0F0D0A   Warm black. Darkroom, not terminal. Not blue-black.
--surface:      #1A1713   Cards and panels lifted off the background.
--surface-hi:   #232019   Elevated: modals, popovers, focused states.
--border:       #2A251F   Barely-there. Graph paper, not grid lines.

--text:         #F0E8D8   Warm parchment. Never pure white.
--text-muted:   #6B6154   Faded ink. Not disabled — secondary.
--text-subtle:  #4A4540   Placeholder, dead metadata.
```

### Accent Palette
```
--accent:       #E8A238   Amber. The color of a Nixie tube digit or oscilloscope trace.
                          Active states, primary actions, running job indicators.
--accent-dim:   #E8A23820 Amber at 12% — hover states, selection backgrounds.

--success:      #4A7C6F   Aged copper teal. Complete, healthy, done.
--success-dim:  #4A7C6F20 Teal at 12% — success backgrounds.

--error:        #C45C3B   Burnt sienna. Unmistakably wrong, not alarmingly red.
--error-dim:    #C45C3B20 Sienna at 12% — error backgrounds.

--warning:      #D4903A   Darker amber variant. Degraded, not failed.
--info:         #5B8DB8   Muted steel blue. The only cool hue in the system; reserved for informational/neutral states.
```

### Semantic Job State Colors
```
Running / Processing  →  --accent    (#E8A238 amber)
Complete / Success    →  --success   (#4A7C6F teal)
Failed / Error        →  --error     (#C45C3B sienna)
Queued / Waiting      →  --text-subtle (#4A4540 neutral)
Paused / Stopped      →  --text-muted  (#6B6154)
```

### Dark Mode
This is a dark-mode-first system. A light mode variant is not planned for this internal tool. If a light mode is ever needed, strategy: invert surface hierarchy (white bg, #1A1713 surface), reduce accent saturation 15%, keep all semantic mappings identical.

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable — respects power users. Information-dense but not claustrophobic. Padding should feel considered, not generous.

```
2xs:   2px   (tight internal padding)
xs:    4px   (inline gaps, icon margins)
sm:    8px   (compact component padding)
md:   16px   (standard component padding)
lg:   24px   (card padding, section gaps)
xl:   32px   (page section separation)
2xl:  48px   (major layout breaks)
3xl:  64px   (hero/display zones)
```

## Layout

- **Approach:** Grid-disciplined with one structural risk — top navigation rail instead of sidebar
- **Navigation:** A 48px persistent horizontal rail at the top of the viewport. Section labels in Geist, monospaced-weight. Active section indicated by an amber bottom border — no filled pills, no background highlights. The full viewport height below the rail belongs to content.
- **Grid:** 12-column at 1280px+, 8-column at 960–1279px, 4-column below
- **Max content width:** 1440px (full-bleed at smaller sizes)
- **Sidebar:** Not used for primary navigation. Reserved for contextual panels within specific views (e.g., job detail, content inspector) — these are collapsible.

### Border Radius
```
sm:    3px   (inputs, chips, small badges)
md:    6px   (cards, dropdowns, modals)
lg:    10px  (large panels)
full:  9999px (pill badges, toggle switches)
```
Deliberately tighter than shadcn defaults — instruments have corners, not bubbles.

## Motion

- **Approach:** Minimal-functional. Motion aids comprehension; it is never decorative.
- **Zero tolerance:** No aurora animations, no glow pulse effects, no gradient sweeps, no floating orb entrances.

```
Easing:
  enter:   cubic-bezier(0, 0, 0.2, 1)   ease-out
  exit:    cubic-bezier(0.4, 0, 1, 1)   ease-in
  move:    cubic-bezier(0.4, 0, 0.2, 1) ease-in-out

Duration:
  micro:   75ms    (hover state flips, toggle switches)
  short:   150ms   (dropdown open/close, tooltip appear)
  medium:  250ms   (panel slide, modal enter)
  long:    400ms   (page transitions, skeleton→content)
```

Pipeline progress indicators: draw as live amber traces on a timeline, not fill-left progress bars. Completed stages flatten to teal. Errors spike. This is the one place motion should feel alive.

## Decisions Log

| Date       | Decision                                    | Rationale |
|------------|---------------------------------------------|-----------|
| 2026-03-25 | Warm dark mode (#0F0D0A base)               | Differentiates from cold-dark-purple AI tools AND generic light tools; better for 8h/day power user sessions |
| 2026-03-25 | Amber (#E8A238) as primary accent           | Breaks the purple/indigo monoculture that dominates the AI marketing category; warm, precise, recognizable |
| 2026-03-25 | Top navigation rail instead of sidebar      | Reclaims ~220px horizontal space for content in a data-heavy internal tool |
| 2026-03-25 | Instrument Serif for display/section heads  | The only AI marketing tool with a serif; creates instrument-meets-editorial tension suited to the name "Profound" |
| 2026-03-25 | Semantic color vocabulary for job states    | Users read system health from color pattern, not icon-scanning; amber=running, teal=done, sienna=error |
| 2026-03-25 | DM Mono for all data/metrics                | Teletype authority; every number feels measured, not rendered |
| 2026-03-25 | Initial design system created               | Created by /design-consultation. Research basis: competitive analysis of Jasper, Copy.ai, HubSpot Breeze, Notion AI — all converge on purple/cold-dark/Inter. This system occupies the unclaimed warm-dark territory. |
