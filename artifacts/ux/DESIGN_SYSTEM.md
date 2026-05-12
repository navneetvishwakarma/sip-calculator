# Design System — SIP Calculator

**Date:** 2026-05-12
**Stack:** Next.js 15 + Tailwind v4 CSS-first (no `tailwind.config.js`) + shadcn/ui + Recharts
**Token naming:** CSS custom properties in `apps/web/src/app/globals.css` under `:root`.

---

## Colour Tokens

All tokens defined as CSS custom properties. Tailwind v4 references them via `--color-*` naming.

```css
:root {
  /* Brand */
  --color-primary:        #1A6BE0;   /* Primary actions, active tabs, CTA buttons, logo */
  --color-primary-hover:  #1558C0;   /* Primary button hover state */
  --color-primary-subtle: #EBF2FF;   /* Primary button ghost background, selected row highlight */

  /* Semantic */
  --color-success:        #16A34A;   /* Total gains value, Perpetual badge, best-value cell highlight */
  --color-success-subtle: #DCFCE7;   /* Success badge background */
  --color-warning:        #D97706;   /* Feasibility warning text */
  --color-warning-subtle: #FEF3C7;   /* Feasibility warning banner background */
  --color-error:          #DC2626;   /* Input border on validation error, inline error text */
  --color-error-subtle:   #FEE2E2;   /* Error banner background */
  --color-info:           #2563EB;   /* Context banner (sign-in redirect) text */
  --color-info-subtle:    #EFF6FF;   /* Context banner background */

  /* Neutrals */
  --color-neutral-50:     #F9FAFB;
  --color-neutral-100:    #F3F4F6;
  --color-neutral-200:    #E5E7EB;   /* Table borders, card borders, dividers */
  --color-neutral-300:    #D1D5DB;   /* Skeleton shimmer base */
  --color-neutral-400:    #9CA3AF;   /* Inflation-adjusted line in chart, icon-only states */
  --color-neutral-500:    #6B7280;   /* text-muted: labels, secondary text, captions */
  --color-neutral-700:    #374151;   /* Body text */
  --color-neutral-900:    #111827;   /* Heading text, primary values */

  /* Surface */
  --color-background:     #FFFFFF;   /* Page background */
  --color-surface:        #FFFFFF;   /* Card, panel, modal backgrounds */
  --color-surface-muted:  #F9FAFB;   /* Alternating table rows, subtle section backgrounds */
  --color-border:         #E5E7EB;   /* Default borders */
  --color-border-strong:  #D1D5DB;   /* Focused input borders */

  /* Destructive */
  --color-destructive:    #DC2626;   /* Destructive action text (Sign out menu item, delete icon) */
  --color-destructive-bg: #FEE2E2;   /* Destructive confirmation banner */
}
```

**Dark mode:** Not in scope for v1. All tokens are light-mode only.

---

## Chart Colour Palette (Recharts)

Four scenario colours for multi-line comparison charts. Each must be distinguishable in both normal and colour-blind vision.

```css
:root {
  --color-chart-1: #1A6BE0;   /* Scenario 1 — primary blue */
  --color-chart-2: #16A34A;   /* Scenario 2 — green */
  --color-chart-3: #D97706;   /* Scenario 3 — amber */
  --color-chart-4: #9333EA;   /* Scenario 4 — purple */
  --color-chart-neutral: #9CA3AF;   /* Inflation-adjusted / secondary series */
}
```

Usage in Recharts: Pass as `stroke` prop on `<Line>` components. Do not use opacity to distinguish scenarios — use the distinct colours.

---

## Typography

Font family: System font stack only. No custom font loading in v1.

```css
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

**Type scale:**

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 12px | 400 | 1.5 | Footer SEBI disclaimer, date stamps, caption labels |
| `--text-sm` | 14px | 400 | 1.5 | Body text, table cell values, input labels, secondary copy |
| `--text-base` | 16px | 400 | 1.5 | Default body, form helper text |
| `--text-lg` | 18px | 600 | 1.4 | Section headings, result metric labels |
| `--text-xl` | 20px | 700 | 1.3 | ResultsPanel primary value (e.g., "₹11.6 Lakh"), page h1 on mobile |
| `--text-2xl` | 24px | 700 | 1.2 | ResultsPanel primary value on desktop, auth page h1 |
| `--text-3xl` | 30px | 800 | 1.1 | Hero result value only — projected corpus large display |

**Weight tokens:**

```css
--font-normal:  400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;
--font-extrabold: 800;
```

---

## Spacing Scale

Base unit: 4px. Scale maps to Tailwind v4 spacing utilities.

```css
:root {
  --spacing-1:  4px;
  --spacing-2:  8px;
  --spacing-3:  12px;
  --spacing-4:  16px;
  --spacing-6:  24px;
  --spacing-8:  32px;
  --spacing-12: 48px;
  --spacing-16: 64px;
}
```

**Usage conventions:**
- Between stacked form groups: `--spacing-6` (24px)
- Between label and input: `--spacing-1` (4px)
- Card internal padding: `--spacing-4` (16px) mobile / `--spacing-6` (24px) desktop
- Between ResultsPanel metric rows: `--spacing-3` (12px)
- Page horizontal padding on mobile: `--spacing-4` (16px)
- Section vertical padding: `--spacing-8` (32px)
- Footer padding: `--spacing-12` (48px) vertical

---

## Border Radius

```css
:root {
  --radius-sm:  4px;    /* Input fields, small badges */
  --radius-md:  8px;    /* Cards, result panels, dropdowns */
  --radius-lg:  12px;   /* Auth card, comparison scenario card */
  --radius-full: 9999px; /* Toggle switch thumb, pill badges */
}
```

---

## Shadow Scale

```css
:root {
  --shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);                           /* Input focus ring surrogate, subtle card lift */
  --shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.07),
                0 2px 4px -2px rgb(0 0 0 / 0.05);                        /* Cards, result panel */
  --shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.08),
                0 4px 6px -4px rgb(0 0 0 / 0.05);                        /* Dropdown menus, save prompt panel */
}
```

---

## Component Inventory

Mapped to shadcn/ui components where applicable.

| Component | shadcn/ui Component | Variants / Notes |
|-----------|---------------------|-----------------|
| Button | `Button` | `primary` (default) \| `secondary` \| `ghost` \| `destructive` |
| Input | `Input` | `default` \| `error` (error border + error text below) \| `disabled` |
| Label | `Label` | Paired with every Input — never unlabelled inputs |
| Card | `Card` | `default` (surface bg + border + shadow-md + radius-md) |
| Badge | `Badge` | `default` (neutral) \| `success` \| `warning` \| `info` |
| Dialog | `Dialog` | Used for: none in v1 — save prompt is inline, not a Dialog |
| Toggle | `Switch` | On/off. Used for inflation-adjusted toggle (VIZ-04) |
| Tooltip | `Tooltip` | Used on: disabled "Add to comparison" button (max scenario limit message) |
| Table | Native HTML `<table>` | Wrapped in `overflow-x: auto` div for mobile scroll. shadcn Table component optional. |
| Separator | `Separator` | Between form sections, between saved scenario rows |
| Toast | `Sonner` (shadcn recommended) | Bottom-centre position. Auto-dismiss 2 seconds. Types: success \| error \| info |
| Skeleton | `Skeleton` | Used in: results panel loading, scenario list loading, nav auth check |
| Tabs | `Tabs` | Calculator type selector. Horizontal scroll on mobile via `overflow-x: auto` on TabsList. |
| DropdownMenu | `DropdownMenu` | User menu in Nav (logged-in state) |
| Alert | Custom (div + colour tokens) | Feasibility warning (UX-04). Not shadcn Alert — needs custom warning-yellow tokens. |

**shadcn/ui components NOT used in v1:**
- Accordion, Calendar, DatePicker, Popover, RadioGroup, Select (use native `<select>` or Tabs for calc type switching), Sheet, Slider

---

## Indian Currency Display Convention

**Rule:** All monetary output values must use INR word format. Raw digit grouping (`₹12,50,000`) is forbidden in results, tables, and chart labels. Input fields accept numeric entry but display formatted preview where feasible.

| Amount Range | Display Format | Example |
|-------------|----------------|---------|
| < ₹1,000 | ₹[amount] | ₹850 |
| ₹1,000 – ₹99,999 | ₹[amount with commas] | ₹5,000 / ₹75,250 |
| ₹1,00,000 – ₹99,99,999 | ₹[X.X] Lakh | ₹1.5 Lakh / ₹12.3 Lakh |
| ₹1,00,00,000 – ₹99,99,99,999 | ₹[X.X] Crore | ₹1.2 Crore / ₹45.7 Crore |
| ≥ ₹1,000 Crore | ₹[X.X] Crore (no further grouping in v1) | ₹1,250.3 Crore |

**Decimal precision:** 1 decimal place for Lakh/Crore display. Round half-up.

**Formatter location:** `packages/core/src/format.ts` — single source of truth. Used by all output rendering in `apps/web`. Never format inline in a component.

**Chart axis labels:** Abbreviated form — "10L", "1Cr", "50L", "2.5Cr". Full word format only in tooltips and result cards.

---

## Tailwind v4 CSS Custom Property Naming

All tokens live in `apps/web/src/app/globals.css` under `:root`. Tailwind v4 picks up CSS custom properties directly — no `tailwind.config.js`.

```css
/* globals.css */
@import "tailwindcss";

@layer base {
  :root {
    --color-primary:        #1A6BE0;
    --color-primary-hover:  #1558C0;
    /* … all tokens as above … */
  }
}
```

**Tailwind v4 usage in JSX:**

```jsx
/* Use CSS variable references directly in Tailwind utility classes */
<div className="bg-[var(--color-surface)] text-[var(--color-neutral-700)]" />

/* Or via @theme in globals.css to register as Tailwind design tokens */
@theme {
  --color-primary: #1A6BE0;        /* → bg-primary, text-primary, border-primary */
  --color-success: #16A34A;        /* → text-success, bg-success */
  --color-error:   #DC2626;        /* → text-error, border-error */
  /* … */
}
```

**Recommendation:** Register all colour, spacing, radius, and shadow tokens under `@theme` so they're available as first-class Tailwind utilities (`bg-primary`, `text-muted`, `rounded-md`, `shadow-md`) without `var()` wrapping.

---

## Minimum Tap Target

All interactive elements on mobile must meet a minimum tap target of **44×44px** (iOS HIG standard, also Android material guidance). Apply via padding on small components:

```css
/* Button ghost / icon-only (e.g. delete icon, copy link icon) */
min-height: 44px;
min-width: 44px;
padding: var(--spacing-2); /* 8px — icon itself can be 20–24px, padding fills the rest */
```

This is enforced at the component level, not per-screen.
