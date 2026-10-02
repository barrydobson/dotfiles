# Visual Elements Reference

Advanced visual patterns and decorative elements for the personal brand. These extend the core
guidelines in SKILL.md with implementation-ready specifications.

---

## Gradient Backgrounds

### Hero Section

The hero section uses a subtle lime halo that bleeds in from above the viewport, creating a
sense of illumination without being overt.

```css
.hero {
  background: #0C0A09;
  position: relative;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% -20%,
    rgba(202, 234, 40, 0.07),
    transparent 70%
  );
  pointer-events: none;
}
```

### Page Vignette

Darkens edges of the viewport to focus attention on centre content.

```css
.page-vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(12, 10, 9, 0.8)
  );
}
```

### Card Subtle Lift

A nearly invisible centre highlight that gives cards a slight editorial lift.

```css
.card-lift {
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.02),
    transparent 60%
  );
}
```

---

## Glow Effects

### Button Glow States

```css
/* Resting state */
.btn-glow {
  box-shadow: 0 0 10px -4px rgba(163, 230, 53, 0.3);
}

/* Hover */
.btn-glow:hover {
  box-shadow: 0 0 10px -2px rgba(163, 230, 53, 0.5);
}

/* Focus / Active */
.btn-glow:focus-visible {
  box-shadow: 0 0 15px -2px rgba(163, 230, 53, 0.6);
  outline: 1px solid rgba(163, 230, 53, 0.4);
  outline-offset: 2px;
}
```

### Integration/Service Icon Glow

For badges representing connected services, use the service's brand colour:

```css
.glow-purple { box-shadow: 0 0 8px rgba(167, 139, 250, 0.5); }
.glow-blue   { box-shadow: 0 0 8px rgba(49, 134, 255, 0.5); }
.glow-orange { box-shadow: 0 0 8px rgba(251, 146, 60, 0.5); }
.glow-cyan   { box-shadow: 0 0 8px rgba(34, 211, 238, 0.5); }
```

---

## Decorative Patterns

### Wireframe Grid Overlay

A subtle 3D wireframe grid as a background texture. Use sparingly — hero sections or
empty-state backgrounds only.

```css
.wireframe-grid {
  background-image:
    linear-gradient(rgba(39, 39, 42, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(39, 39, 42, 0.3) 1px, transparent 1px);
  background-size: 60px 60px;
}
```

### Terminal Decoration

Monospace micro-copy used as structural decoration, not content.

- Font: JetBrains Mono, 10px, UPPERCASE
- Colour: Faint Text (#52525B) — should barely register
- Tracking: 0.15em
- Examples: `SYS.ONLINE`, `STATUS: ACTIVE`, `v2.4.1`, `BUILD: PASSING`

Place in corners of hero sections or as section dividers. Never in content areas where they
compete with actual information.

### Numbered Badge

Used to prefix feature lists or portfolio items, giving a systematic feel.

```css
.numbered-badge {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: #71717A;
  letter-spacing: 0.1em;
}
```

Format: two-digit zero-padded (`01`, `02`, `03`).

### Status Indicator Dot

A pulsing emerald dot indicating live/active status.

```css
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Tailwind CSS Configuration

For projects using Tailwind, extend the default config:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0C0A09",
          surface: "#18181B",
          border: "#27272A",
          lime: "#CAEA28",
          "lime-light": "#A3E635",
          emerald: "#10B981",
        },
      },
      fontFamily: {
        display: ['"Clash Display"', "Inter", "system-ui", "sans-serif"],
        heading: ['"Clash Grotesk"', "Inter", "system-ui", "sans-serif"],
        body: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      boxShadow: {
        glow: "0 0 10px -4px rgba(163, 230, 53, 0.3)",
        "glow-md": "0 0 10px -2px rgba(163, 230, 53, 0.5)",
        "glow-lg": "0 0 15px -2px rgba(163, 230, 53, 0.6)",
      },
    },
  },
};
```

---

## HTML Boilerplate

Minimal HTML starter with fonts and base styles:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Barry Dobson</title>

  <!-- Fonts -->
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600&f[]=clash-grotesk@400,500,600&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />

  <style>
    :root {
      --bg: #0C0A09;
      --surface: #18181B;
      --border: #27272A;
      --lime: #CAEA28;
      --lime-light: #A3E635;
      --text-primary: #FAFAFA;
      --text-secondary: #D4D4D8;
      --text-tertiary: #A1A1AA;
      --text-muted: #71717A;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg);
      color: var(--text-secondary);
      font-family: "Geist", "Inter", system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    h1, h2, h3 { color: var(--text-primary); }
    h1 { font-family: "Clash Display", sans-serif; font-weight: 400; letter-spacing: -0.05em; line-height: 1.1; }
    h2 { font-family: "Clash Grotesk", sans-serif; font-weight: 500; letter-spacing: -0.02em; line-height: 1.2; }
    h3 { font-family: "Clash Grotesk", sans-serif; font-weight: 500; line-height: 1.3; }

    code, pre { font-family: "Geist Mono", "JetBrains Mono", monospace; }

    a { color: var(--lime); text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <!-- Content here -->
</body>
</html>
```

---

## PDF / ReportLab Notes

When generating PDFs with ReportLab or similar Python libraries:

- Clash Display and Clash Grotesk are variable .ttf files — ReportLab can load these via
  `pdfmetrics.registerFont(TTFont("ClashDisplay", "ClashDisplay-Variable.ttf"))`
- Fallback heading font: **Inter Bold** or **Liberation Sans Bold**
- Fallback body font: **Inter Regular** or **Liberation Sans**
- Background: fill the full page with #0C0A09 first, then layer content on top
- Lime accent: use sparingly — section dividers, page numbers, highlighted data points
- Ensure sufficient contrast: never place Muted Text (#71717A) on Surface (#18181B)

## Presentation / Slide Notes

- Slide background: #0C0A09 (warm near-black)
- Title slides: Clash Display, 48-60px, centred, with lime halo gradient behind
- Content slides: Clash Grotesk headings, Geist body, left-aligned
- Code slides: Surface (#18181B) background code block, Geist Mono
- Accent rule: one lime element per slide maximum — a heading underline, a highlighted stat, or
  a CTA button — never multiple lime elements competing for attention
