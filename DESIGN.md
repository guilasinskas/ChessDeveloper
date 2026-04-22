# Chesskit — Grandmaster Vision Design System

## North Star

**"Technical Mastery, Intellectual Precision."**

A dark-first, developer-grade UI engineered for serious analysis and competitive play. The interface recedes — surfaces are invisible, only the board and data matter. Accents are used exclusively for function, never decoration.

---

## Colors

All tokens are defined in [`src/constants.ts`](src/constants.ts) as `CC`.

### Surface Hierarchy (dark mode)

| Token | Hex | Role |
|-------|-----|------|
| `CC.bg0` | `#0c0e12` | surface-container-lowest — deepest layer, nav bg |
| `CC.bg1` | `#111317` | background — page / body |
| `CC.bg2` | `#1e2024` | surface-container — panels, cards |
| `CC.bg3` | `#282a2e` | surface-container-high — hover surfaces |
| `CC.bg4` | `#333539` | surface-container-highest — active / selected |
| `CC.bg5` | `#414754` | outline-variant — strong borders |
| `CC.navBg` | `#0f1115` | TopAppBar background |
| `CC.navBorder` | `#2d3139` | TopAppBar bottom border |

### Light Mode Surfaces

| Token | Hex |
|-------|-----|
| `CC.lBg0` | `#f0f2f8` |
| `CC.lBg1` | `#ffffff` |
| `CC.lBg2` | `#f4f6fd` |
| `CC.lBg3` | `#e8eaf8` |

### Accent Colors

| Token | Hex | Role |
|-------|-----|------|
| `CC.primary` | `#acc7ff` | Technical Blue — all interactive elements, focus rings, active states |
| `CC.primaryDark` | `#468fff` | Button fills, key highlights |
| `CC.primaryMuted` | `rgba(172,199,255,0.12)` | Active background tints |
| `CC.primarySubtle` | `rgba(172,199,255,0.06)` | Hover background tints |
| `CC.green` | `#4ae183` | Grandmaster Green — success states, correct moves, positive analysis only |
| `CC.gold` | `#f0bf5f` | Antique Gold — secondary actions, warnings, clock alerts |
| `CC.error` | `#ffb4ab` | Error states |

### Text

| Token | Hex | Role |
|-------|-----|------|
| `CC.text` | `#e2e2e8` | on-surface — primary text |
| `CC.textSub` | `#c1c6d6` | on-surface-variant — secondary text |
| `CC.textMuted` | `#8b91a0` | outline — muted, labels |
| `CC.lText` | `#1a1c20` | Light mode primary |
| `CC.lTextSub` | `#40444e` | Light mode secondary |

### Borders

| Token | Hex |
|-------|-----|
| `CC.border` | `#414754` |
| `CC.borderHover` | `#5a6070` |
| `CC.lBorder` | `#c4c8d8` |

### Chess Board

| Square | Hex | Name |
|--------|-----|------|
| Light squares | `#b8bfc6` | Smoked Ash |
| Dark squares | `#2c231e` | Deep Espresso |

These values are set directly in [`src/components/board/index.tsx`](src/components/board/index.tsx).

---

## Typography

Two typefaces, each with a distinct role:

### Space Grotesk — Structural / UI
CSS variable: `--font-space-grotesk`

Used for: headings, navigation, labels, move notation, buttons, data values, captions.

- Letter-spacing: `-0.04em` on headings, `0.02em` on labels/captions, `0.05em` on notation
- Weights used: 300, 400, 500, 600, 700

| Style | Size | Weight | Letter-spacing |
|-------|------|--------|---------------|
| h1 | 48px | 700 | -0.04em |
| h2 | 32px | 600 | -0.04em |
| h3 | 24px | 600 | -0.04em |
| label / caption | 12px | 500 | 0.02em |
| notation | 14px | 700 | 0.05em |
| button | 14px | 600 | -0.01em |

### Montserrat Alternates — Body / Content
CSS variable: `--font-montserrat-alt`

Used for: body text, analysis descriptions, inputs, menu items, data cells.

- Letter-spacing: `-0.05em` (creates the distinctive sleek, dense look)
- Weights used: 300, 400, 500, 600

| Style | Size | Weight | Letter-spacing |
|-------|------|--------|---------------|
| body1 | 16px | 400 | -0.05em |
| body2 | 14px | 400 | -0.05em |

Fonts are loaded via `next/font/google` in [`src/pages/_app.tsx`](src/pages/_app.tsx) and injected as CSS variables into the root `<div>`.

---

## Elevation & Separation

- **Never use heavy shadows.** Use `1px solid CC.border` borders for all panel separation.
- Panels are differentiated by their surface tier, not drop shadows.
- Modals/dialogs use a single `0 8px 40px rgba(0,0,0,0.8)` shadow — the only exception.
- Precision Glow for interactive feedback: `0 0 0 8px CC.primaryMuted` on sliders/thumbs.

---

## Shape / Border Radius

| Scale | Value | Usage |
|-------|-------|-------|
| default | 2px | Move list cells, chips, base components |
| md | 4px | Buttons, inputs, list items, nav items |
| lg | 6–8px | Panels, cards, dialogs |
| none | 0px | Board squares (grid must stay perfectly sharp) |

Border radius is set globally via `shape: { borderRadius: 2 }` in the MUI theme.

---

## Components

### TopAppBar (NavBar)
- Height: **64px**
- Background: `CC.navBg` (`#0f1115`)
- Bottom border: `1px solid CC.navBorder` (`#2d3139`)
- Active link: `2px` bottom border in `CC.primary` + text color `CC.primary`
- Inactive links: `CC.textSub` color, hover to `CC.text`
- Font: Space Grotesk 14px / 600 weight when active

### Drawer (NavMenu)
- Width: 240px
- Background: `CC.bg0`
- Active item: `2px left border CC.primary` + `CC.primaryMuted` background + `CC.primary` text
- Inactive items: `CC.textSub` text

### Move List
- Compact 2-column grid (white move | black move), 28px row min-height
- Current move indicator: `2px left border CC.primary` + `CC.primaryMuted` background tint
- Row separator: `1px solid CC.border`
- Move number column: `CC.textMuted`, 2.2rem fixed width
- Move notation: Space Grotesk (via `PrettyMoveSan`), 0.8rem

### Evaluation Bar
- Thin vertical strip (1.2–1.5rem wide) beside the board
- Black bar: `CC.bg0` (`#0c0e12`)
- White bar: `CC.text` (`#e2e2e8`)
- Score label: Space Grotesk 0.65rem bold
- Transition: `0.7s ease` on height changes
- Border: `1px solid CC.border`, radius 2px

### Engine Line Evaluation Badge
- Fixed 3.2em wide pill beside each engine line
- Black advantage: `CC.bg0` bg, `CC.text` text, `CC.border` border
- White advantage: `CC.text` bg, `CC.bg1` text, `CC.bg5` border

### Player Metric Blocks
- Black metric: `CC.bg0` bg, `CC.text` text, `3px solid CC.bg5` left accent
- White metric: `CC.text` bg, `CC.bg1` text, `3px solid CC.bg5` left accent

### Player Header (Avatar + Clock)
- Avatar: 32×32px, 4px radius
  - White player: `CC.text` background, `CC.bg1` text
  - Black player: `CC.bg0` background, `CC.text` text
- Clock badge: matches avatar color scheme, 4px radius, Space Grotesk 0.82rem bold

### Buttons
- **Primary**: `CC.primaryDark` fill, white text → hover: `CC.primary` fill, `#002f67` text
- **Secondary**: `CC.bg3` fill → hover: `CC.bg4`
- **Outlined**: `CC.primary` border + text → hover: `CC.primaryMuted` bg tint
- No gradients. No transform animations on hover/active.
- All buttons: Space Grotesk, 600 weight, no text-transform

### Inputs / TextFields
- Background: `CC.bg3` (dark) / `#f0f2f8` (light)
- Border: `CC.border` → focus: `2px solid CC.primary`
- Font: Montserrat Alternates, 14px
- Border radius: 4px

### Tabs
- Active tab: `CC.primary` text + 2px `CC.primary` indicator
- Inactive: `CC.textSub` → hover `CC.text`
- Indicator height: 2px

---

## Rules

1. **Accents for function only.** Blue (`CC.primary`) means "interactive". Green (`CC.green`) means "correct/success". Gold (`CC.gold`) means "warning/secondary". Never use accent colors decoratively.
2. **Dark surfaces only.** The design is dark-first. Light mode is a secondary fallback using cool blue-tinted grays.
3. **Borders over shadows.** Use `1px solid CC.border` to separate sections. Reserve shadows for modals only.
4. **Board squares are sacred.** Always `0px` radius on board squares. The grid must stay perfectly sharp.
5. **Space Grotesk for structure, Montserrat Alternates for content.** Never mix them on the same semantic element.
6. **Never increase opacity for disabled states.** Use `CC.bg4` bg + `CC.textMuted` text instead.
