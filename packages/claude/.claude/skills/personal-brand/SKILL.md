---
name: personal-brand
description: |
  Apply Barry Dobson's personal brand guidelines to any generated artifact — websites, HTML pages,
  presentations, PDFs, dashboards, diagrams, social media graphics, or any visual output. Use this
  skill whenever the user asks for something "personal branded", "my brand", "my style", or when
  producing any personal portfolio piece, blog, side-project landing page, conference talk, or
  personal-branded deliverable. Also trigger when the user mentions personal colours, personal fonts,
  or dark-themed professional output that should look polished and distinctive. If the user is creating
  a personal website, portfolio, resume, or any artifact representing Barry (not Tote), this skill
  should be consulted. Do NOT use this for Tote corporate branding — use the brand-guidelines skill
  for that instead.
---

# Personal Brand Guidelines

This skill ensures all personal-branded artifacts follow a consistent visual identity inspired by
dark technical aesthetics — controlled power, editorial typography, and a high-voltage lime accent
on warm near-black. The brand reads as serious engineering craft with a strong design voice.

Read this entire file before generating any branded output. For detailed specifications on
decorative elements and advanced patterns, see `references/visual-elements.md`.

## Tools

### SVG Wordmark Generator

Generate text rendered as SVG paths using the brand fonts. The output is self-contained — no font
installation required to display it correctly.

```bash
uv run {baseDir}/scripts/generate_wordmark.py "Text Here"
```

**Styles:**

| Style | Font | Colour | Use for |
|-------|------|--------|---------|
| `display` (default) | Clash Display 400 | Lime #CAEA28 | Hero headlines, page titles, wordmarks |
| `heading` | Clash Grotesk 500 | White #FAFAFA | Section headings, subtitles |
| `mono-label` | JetBrains Mono 400 | Grey #A1A1AA | Eyebrow labels, categories (auto UPPERCASE) |

**Options:**
- `--style display|heading|mono-label` — preset style
- `--weight 200|300|400|500|600|700` — font weight (Extralight to Bold)
- `--color "#hex"` — override text colour
- `--bg "#hex"` — add a background rectangle (transparent by default)
- `--size 48` — override font size in px
- `--tracking -0.03` — letter-spacing as em fraction
- `--padding 24` — padding around text in px
- `--output file.svg` — write to file (default: stdout)

**Font resolution order:** `~/Library/Fonts/` (installed) > `~/Downloads/*_Complete/` (Fontshare
downloads) > remote download from Fontshare. All weights (200-700) supported when using local files.

**Examples:**
```bash
# Hero wordmark in lime on transparent
uv run {baseDir}/scripts/generate_wordmark.py "Barry Dobson" -o wordmark.svg

# Section heading in white
uv run {baseDir}/scripts/generate_wordmark.py "Projects" --style heading -o heading.svg

# Monospace eyebrow label
uv run {baseDir}/scripts/generate_wordmark.py "LATEST WORK" --style mono-label -o label.svg

# Custom: large white text on dark background with padding
uv run {baseDir}/scripts/generate_wordmark.py "Hello" --color "#FAFAFA" --bg "#0C0A09" --size 72 --padding 32 -o hero.svg
```

Use this script whenever an artifact needs branded text rendered as vector paths — document
headers, presentation title slides, social media banners, portfolio hero sections. The SVG output
can be embedded directly in HTML, included in PDFs, or used as standalone images.

---

## When to Use

- Personal portfolio sites, blogs, landing pages, or side-project marketing
- Conference talks, slide decks, or presentations representing Barry (not Tote)
- Personal dashboards, tools, or developer-facing UIs
- Resumes, CVs, or professional profile pages
- Any artifact the user describes as "my brand", "personal style", or "dark themed"

## When NOT to Use

- Tote corporate deliverables (use the `brand-guidelines` skill instead)
- Client work that should follow the client's brand
- Quick throwaway prototypes where branding is irrelevant
- Pure code output with no visual component

---

## Brand Identity

### Personality

**Controlled power.** The brand says: "this is serious engineering, built with craft." It projects
competence and technical depth while maintaining a strong visual identity. It is not playful or
startup-casual — it is precise, restrained, and confident.

### Design Pillars

1. **Dark precision** — near-black backgrounds, clean grids, deliberate whitespace
2. **High-voltage accent** — lime-yellow on dark is the single biggest visual signature
3. **Terminal grit** — monospace labels, systematic numbering, engineering vocabulary as design language
4. **Editorial type** — display fonts at large sizes kept light-weight for elegance, not heavy-handed

---

## Colour Palette

Every artifact should draw exclusively from this palette. The warm stone-black base distinguishes
this from cold corporate dark themes.

### Core Colours

| Name | Hex | RGB | Role |
|------|-----|-----|------|
| Background | #0C0A09 | 12, 10, 9 | Primary page background. Warm near-black (stone-950) |
| Surface | #18181B | 24, 24, 27 | Cards, panels, elevated surfaces (zinc-900) |
| Border | #27272A | 39, 39, 42 | Card borders, dividers, subtle structure (zinc-800) |
| Lime | #CAEA28 | 202, 234, 40 | Primary accent. CTAs, highlights, brand moments |
| Lime Light | #A3E635 | 163, 230, 53 | Secondary accent. Glow effects, hover states (lime-400) |
| Emerald | #10B981 | 16, 185, 129 | Status indicators, live/success states |

### Text Colours

| Name | Hex | Role |
|------|-----|------|
| Primary Text | #FAFAFA | Headlines, primary body text (stone-50) |
| Secondary Text | #D4D4D8 | Supporting copy, descriptions (zinc-300) |
| Tertiary Text | #A1A1AA | Labels, metadata, captions (zinc-400) |
| Muted Text | #71717A | Disabled states, placeholder text (zinc-500) |
| Faint Text | #52525B | Decorative text, background labels (zinc-600) |

### Colour usage principles

Lime is the hero — it draws the eye and signals interaction. Use it for CTAs, active states, and
brand-defining moments. Do not overuse it; its power comes from contrast against the dark base.

The warm `#0C0A09` background (stone, not slate or zinc) is intentional — it has a subtle warmth
that makes long reading sessions more comfortable than pure cold-dark themes.

Surface colours (`#18181B`) create depth through layering, not through shadows. Cards sit on
surfaces; surfaces sit on background. This creates a subtle z-axis without drop shadows.

---

## Typography

### Font Stack

| Font | Role | Weights | Source |
|------|------|---------|--------|
| **Clash Display** | Hero headlines, page titles | 400 (normal) | [Fontshare](https://www.fontshare.com/fonts/clash-display) |
| **Clash Grotesk** | Section headings, UI headings | 400-600 | [Fontshare](https://www.fontshare.com/fonts/clash-grotesk) |
| **Geist** | Body text, general UI copy | 400-500 | [Vercel Geist](https://vercel.com/font) |
| **Geist Mono** | Code snippets, data labels | 400 | [Vercel Geist](https://vercel.com/font) |
| **JetBrains Mono** | Terminal output, system labels | 400 | [JetBrains](https://www.jetbrains.com/lp/mono/) |

All fonts are variable-weight. Clash Display and Clash Grotesk are free from Fontshare.
Geist and Geist Mono are free from Vercel. JetBrains Mono is open source.

### Fallback Stacks

```css
--font-display: "Clash Display", "Inter", system-ui, sans-serif;
--font-heading: "Clash Grotesk", "Inter", system-ui, sans-serif;
--font-body: "Geist", "Inter", system-ui, sans-serif;
--font-mono: "Geist Mono", "JetBrains Mono", "Fira Code", monospace;
```

### Type Scale and Usage

| Element | Font | Size | Weight | Tracking | Leading |
|---------|------|------|--------|----------|---------|
| Hero headline | Clash Display | 40-72px | 400 | -0.05em (tight) | 1.1 |
| Page title | Clash Display | 30-40px | 400 | -0.03em | 1.15 |
| Section heading | Clash Grotesk | 20-24px | 500 | -0.02em | 1.2 |
| Subsection | Clash Grotesk | 16-18px | 500 | 0 | 1.3 |
| Body copy | Geist | 14-16px | 400 | 0 | 1.5 |
| Small text | Geist | 12-13px | 400 | 0 | 1.4 |
| Mono label | JetBrains Mono | 10-11px | 400 | 0.15em (wide) | 1.2 |
| Code block | Geist Mono | 13-14px | 400 | 0 | 1.6 |

### Type Rules

- Display fonts (Clash Display) are kept at normal weight (400) at large sizes — this creates
  elegance, not heaviness. Bold display type feels aggressive; light display type feels premium.
- Mono labels are UPPERCASE with wide letter-spacing (0.15em). They act as structural markers,
  not content — think section eyebrows, category tags, metadata.
- Never use more than three font families in a single artifact.
- Hero headlines should feel expansive — large size, tight leading, lots of surrounding whitespace.

---

## Layout Principles

### Spacing

Base unit: 4px. All spacing is multiples of this unit.

| Context | Value | Notes |
|---------|-------|-------|
| Section padding | 128-176px vertical | Generous breathing room between sections |
| Container max-width | 1200-1600px | Wide but always horizontally padded (24px minimum) |
| Card inner padding | 24px | Consistent internal spacing |
| Grid gaps | 20px (dense), 48-80px (feature pairs) | Tighter for grids, wider for hero layouts |
| Component spacing | 8-16px | Between related elements within a component |

### Visual Hierarchy

Build hierarchy through font size, weight, and colour — not borders or boxes. A typical page:

1. **Hero headline**: Clash Display, 40-72px, Primary Text (#FAFAFA)
2. **Section heading**: Clash Grotesk, 20-24px, Primary Text
3. **Subsection**: Clash Grotesk, 16-18px, Secondary Text (#D4D4D8)
4. **Body text**: Geist, 14-16px, Secondary Text
5. **Meta/label**: JetBrains Mono, 10-11px, Tertiary Text (#A1A1AA), UPPERCASE

### Grid Patterns

- **2-column feature split**: `grid-cols-1 lg:grid-cols-2` with 48-80px gap
- **3-column cards**: `grid-cols-1 md:grid-cols-3` with 20px gap
- **Single column content**: max-width 720px, centered, for long-form text

---

## Components

### Cards

**Standard card:**
```
background: #18181B (70% opacity for interactive)
border: 1px solid #27272A
border-radius: 8px
padding: 24px
```

No drop shadows. Depth comes from background layering. On hover, borders can transition to
Lime (#CAEA28) at reduced opacity.

### Buttons

**Primary CTA:**
```
background: #CAEA28
color: #0C0A09
font: Clash Grotesk or Geist, 500 weight
padding: 8px 24px
border-radius: 6-8px
```

**Ghost/Outline:**
```
background: transparent
color: #A1A1AA
border: 1px solid #27272A
hover: border-color #CAEA28, color #CAEA28
```

**Icon button with glow:**
```
background: rgba(163, 230, 53, 0.1)
border: 1px solid rgba(163, 230, 53, 0.2)
color: #A3E635
box-shadow: 0 0 10px -4px rgba(163, 230, 53, 0.3)
```

### Badges and Status Chips

```
display: inline-flex
padding: 2px 6px
border-radius: 4px
font: JetBrains Mono, 9-10px, UPPERCASE, wide tracking
```

Colour variants use 10% opacity backgrounds — tinted, never solid:
- Lime (default/positive): `bg: rgba(202,234,40,0.1)` / `text: #CAEA28`
- Emerald (success/live): `bg: rgba(16,185,129,0.1)` / `text: #10B981`
- Muted (neutral): `bg: rgba(161,161,170,0.1)` / `text: #A1A1AA`

### Tables

- **Header row**: Surface (#18181B) background, Primary Text, Geist or Clash Grotesk 500
- **Body rows**: transparent or very subtle alternating (Surface at 30% opacity)
- **Borders**: single bottom border per row using Border (#27272A), no grid lines
- **Alignment**: left-align text, right-align numbers
- **Highlight rows**: tinted accent at 10% opacity

---

## Glow and Effects

The signature visual effect is **lime glow** — used instead of traditional shadows for interactive
and brand moments.

| Context | Box-shadow |
|---------|-----------|
| Subtle glow | `0 0 10px -4px rgba(163, 230, 53, 0.3)` |
| Medium glow (hover) | `0 0 10px -2px rgba(163, 230, 53, 0.5)` |
| Strong glow (focus) | `0 0 15px -2px rgba(163, 230, 53, 0.6)` |

For non-interactive structural elevation, use `shadow-lg` with `rgba(0,0,0,0.2)` — keep it subtle.

### Gradient Patterns

- **Hero halo**: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(202,234,40,0.07), transparent 70%)` — lime glow bleeding from above
- **Vignette**: `radial-gradient(ellipse at center, transparent 50%, rgba(12,10,9,0.8))` — darkens page edges
- **Subtle centre lift**: `radial-gradient(ellipse at center, rgba(255,255,255,0.02), transparent 60%)` — barely-there highlight

---

## Animation and Motion

Motion is subtle and purposeful — never gratuitous.

- **Transitions**: `transition: all 150ms ease` for micro-interactions (hover, focus)
- **Colour transitions**: `transition: color 150ms, border-color 150ms` for hover states
- **Status pulse**: `animate-pulse` on live/active indicator dots (Emerald #10B981)
- **Loading**: `animate-spin` for spinners, keep them small and muted
- **No page transitions**: content appears immediately, no slide/fade on navigation

---

## Charts and Data Visualisation

- Use brand colours from the palette — never introduce non-brand colours
- Primary data series: Lime (#CAEA28)
- Secondary series: Lime Light (#A3E635), Emerald (#10B981)
- Use varying opacity of Lime for additional series before introducing new hues
- Axis labels: Geist, 12px, Tertiary Text (#A1A1AA)
- Grid lines: Border (#27272A) at 50% opacity — barely visible
- Chart backgrounds: transparent (let the page background show through)

---

## Terminal / Code Aesthetic

This brand leans into engineering identity. Use terminal-inspired elements as design vocabulary:

- **Eyebrow labels**: monospace, UPPERCASE, wide-tracked, muted colour — used above sections
  like `PROJECTS`, `ABOUT`, `SYS.STATUS`
- **Numbered features**: prefix items with `01`, `02`, `03` in monospace for systematic feel
- **Status strings**: `System_Online`, `Status: ACTIVE` as decorative micro-copy
- **Code blocks**: Surface background, 1px Border, Geist Mono, with subtle syntax highlighting

---

## Practical Checklist

Before finalising any personal-branded artifact, verify:

- [ ] Background is warm near-black (#0C0A09), not pure black (#000) or cold grey
- [ ] Only palette colours used — no rogue greys or off-brand accents
- [ ] Lime accent (#CAEA28) is used sparingly for maximum impact — not splashed everywhere
- [ ] Headlines use Clash Display at normal weight (400), not bold
- [ ] Body text uses Geist — not the display font
- [ ] Mono labels are UPPERCASE with wide letter-spacing
- [ ] Cards use background layering for depth, not drop shadows
- [ ] Interactive elements use lime glow, not traditional shadow elevation
- [ ] Generous whitespace — nothing feels cramped
- [ ] Text contrast is sufficient: Primary Text on Background, not Muted Text on Surface
- [ ] This is personal brand, not Tote corporate brand
