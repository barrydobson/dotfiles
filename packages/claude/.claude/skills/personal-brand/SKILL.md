---
name: personal-brand
description: Applies Barry Dobson's personal colours (the Voltaic palette, dark and light) and fonts (Clash Display, Clash Grotesk, Geist, JetBrains Mono) when creating a document, web page, slide deck, dashboard, chart, diagram or other visual output for Barry personally. Use when the user asks for "my brand", "my style", "my colours" or "personal branded" output, or builds anything representing Barry personally. Do not use for work output that follows an employer or client brand.
---

# Personal brand

Use these colours and fonts for any visual output that represents Barry personally. Default to the dark flavour. Use light when the output is for print or the user asks for it.

## Colours

### Backgrounds and text

| Name      | Dark      | Light     | Use for                                           |
| --------- | --------- | --------- | ------------------------------------------------- |
| `base`    | `#09090b` | `#f0efed` | Page background                                   |
| `deep`    | `#0c0a09` | `#faf9f7` | Code blocks, canvas areas, text on an accent fill |
| `surface` | `#18181b` | `#ffffff` | Cards, panels, table header rows                  |
| `overlay` | `#27272a` | `#e4e4e7` | Borders, dividers, hover                          |
| `muted`   | `#3f3f46` | `#d4d4d8` | Rules, separators                                 |
| `dim`     | `#52525b` | `#a1a1aa` | Disabled and placeholder text                     |
| `subtle`  | `#787881` | `#6c6c75` | Captions, de-emphasised text                      |
| `soft`    | `#a1a1aa` | `#52525b` | Secondary text, labels                            |
| `text`    | `#d4d4d8` | `#3f3f46` | Body text                                         |
| `bright`  | `#fafafa` | `#27272a` | Headings, emphasised text                         |

### Accents

| Name    | Dark      | Light     | Use for                                                      |
| ------- | --------- | --------- | ------------------------------------------------------------ |
| `volt`  | `#c8ff00` | `#4c790f` | Signature accent: fills, buttons, focus rings, brand moments |
| `arc`   | `#a3e635` | `#3f6212` | Accent text and icons                                        |
| `blue`  | `#7aa2f7` | `#1d4ed8` | Links, information                                           |
| `jade`  | `#10b981` | `#047857` | Success                                                      |
| `amber` | `#e0af68` | `#9c5f07` | Warning                                                      |
| `ember` | `#f7768e` | `#be123c` | Error                                                        |

Rules:

- Accent text uses `arc`, not `volt`. Reserve `volt` for shapes, and put `deep` text on a `volt` fill.
- Use `volt` sparingly. It works because everything around it is grey.
- Success is `jade`, not `volt`.
- For translucent fills, use only these opacities: 8%, 14%, 20%, 30% and 50%. Never put text on the 50% fill.
- Body text must keep at least 4.5:1 contrast against its background.

### Charts

Series that mean a state take the status colours: `jade`, `amber`, `ember`. Other series take this order, and stop when you have enough: `blue`, `teal`, `bronze`, `ice`, `lilac`.

| Name     | Dark      | Light     |
| -------- | --------- | --------- |
| `teal`   | `#73daca` | `#0f766e` |
| `bronze` | `#b9a58c` | `#92400e` |
| `ice`    | `#89ddff` | `#52525b` |
| `lilac`  | `#d4bff0` | `#8b5cf6` |

Never use `volt` or `arc` as a series colour. Grid lines use `overlay`, and axis labels use `soft`.

## Fonts

| Font           | Use for                   | Weight     |
| -------------- | ------------------------- | ---------- |
| Clash Display  | Titles and hero headlines | 400        |
| Clash Grotesk  | Section headings          | 500        |
| Geist          | Body text                 | 400 to 500 |
| JetBrains Mono | Code, labels, metadata    | 400        |

Clash Display and Clash Grotesk come from Fontshare. Geist comes from Vercel. JetBrains Mono is open source. Use no more than three of these in one piece of output.

```css
--font-display: "Clash Display", "Inter", system-ui, sans-serif;
--font-heading: "Clash Grotesk", "Inter", system-ui, sans-serif;
--font-body: "Geist", "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Geist Mono", monospace;
```

Keep display type at normal weight, not bold. Mono labels are uppercase with wide letter-spacing (0.15em).
