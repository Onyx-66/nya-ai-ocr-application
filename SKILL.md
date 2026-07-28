# Nya Smart OCR — Design System & Style Guide

> This file is the single source of truth for the app's visual language.
> **Do not deviate from the values below unless the user explicitly asks for a change.**
> When making UI edits, reference these specs so buttons, colors, spacing, and alignment stay consistent across every page.

---

## 1. Theme & Color Tokens

All colors are HSL channel triplets defined as CSS variables in `src/index.css` and consumed via `hsl(var(--token))`. **Always use token classes** — never hardcode hex values in JSX (the chart accent `#7c6ff5` is the one documented exception, used inside recharts SVG props).

### Default (Midnight) theme — `:root`
| Token | HSL channels | Usage |
|---|---|---|
| `--c-bg` | `222 47% 4%` | App background (`#0a0c12`) |
| `--c-card` | `222 40% 9%` | Cards, panels, sidebar, header bar |
| `--c-soft` | `217 33% 14%` | Secondary surfaces, hover, soft buttons |
| `--c-soft-2` | `217 33% 20%` | Hover states of soft surfaces |
| `--c-border` | `217 33% 18%` | All borders (solid and dashed) |
| `--c-input` | `222 47% 6%` | Input field backgrounds |
| `--c-text` | `210 40% 98%` | Primary text / headings |
| `--c-text-soft` | `213 27% 84%` | Secondary text |
| `--c-dim` | `215 20% 55%` | Tertiary text, labels, placeholders, icons |
| `--c-accent` | `243 75% 61%` | Primary accent (purple `#5d5ce6`-ish) |
| `--c-accent-2` | `245 76% 68%` | Hover state of accent |

### Alternate themes (selected via `data-theme="..."` on a wrapper)
`ocean`, `emerald`, `rose`, `amber`, `violet`, `crimson`, `teal`, `graphite`, `light`. Each overrides the same `--c-*` tokens. **Default the app to midnight** (no `data-theme` attribute).

### Status colors (Tailwind named, used inline)
- Success / done → `text-emerald-400` / `bg-emerald-500`
- Running → `text-[hsl(var(--c-accent))]` + spinner (`Loader2 animate-spin`)
- Error / destructive → `text-rose-400`, `bg-rose-500`, `hover:bg-rose-600`, `bg-rose-500/10`

### Typography
- Fonts: `Inter`, `Poppins`, `Roboto`, `Merriweather` imported in `index.css`.
- Role tokens: `--font-heading`, `--font-body`, `--font-display`, `--font-mono`.
- Use Tailwind classes: `font-heading` (page/section titles), `font-body` (default), `font-mono` (format labels like `.txt`).
- Page title: `text-2xl font-heading font-semibold text-[hsl(var(--c-text))]`.
- Section header inside a card: `text-sm font-medium text-[hsl(var(--c-text))]`.
- Body / description: `text-sm text-[hsl(var(--c-dim))]`.
- Field label: `text-xs text-[hsl(var(--c-dim))]` with `mb-1.5`.
- Stat label: `text-[11px] uppercase tracking-wide text-[hsl(var(--c-dim))]`.
- Stat value: `text-2xl font-semibold text-[hsl(var(--c-text))]`.

---

## 2. Layout & Spacing

### Page container
Every page wraps content in:
```jsx
<div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto">
```
- Max width `max-w-4xl` (≈896px), centered.
- Responsive padding: `p-4` mobile → `sm:p-6` → `md:p-10`.

### App shell (`src/components/Layout.jsx`)
- Desktop (≥`lg`): left sidebar `w-16` (icons only) → expands to `w-60` at `xl` (icons + labels). Main content fills the rest, `overflow-auto`, `pb-20 lg:pb-0`.
- Mobile/tablet (<`lg`): sticky top header `h-14` (`bg-[hsl(var(--c-card))]/95 backdrop-blur`); fixed bottom nav with 5 equal items.
- Sidebar / bottom-nav item active state: `bg-[hsl(var(--c-accent))] text-white` (desktop), `text-[hsl(var(--c-accent))]` (mobile). Inactive: `text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))]`.

### Section rhythm
- Between page title and first content block: `mb-6`.
- Between stacked cards/sections: `space-y-4` (or `space-y-5`).
- Inside an options card: `space-y-4`, divided by `border-t border-[hsl(var(--c-border))] pt-4` when grouping differs (e.g. toggles).

### Card
```jsx
<div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
```
- Radius `rounded-xl` (12px). Padding `p-4`. Border `border-[hsl(var(--c-border))]`.
- Collapsible card header row: `w-full flex items-center gap-2 p-4 text-left`, chevron rotates `-rotate-90` when closed.

### Empty state
```jsx
<div className="rounded-xl border border-dashed border-[hsl(var(--c-border))] p-10 text-center text-[hsl(var(--c-dim))]">
  <Icon className="w-8 h-8 mx-auto mb-2" />
  <p className="text-sm">...</p>
</div>
```

---

## 3. Buttons — Sizes, Styles & Placement

### Primary action button (full-width, prominent)
Used for the main page action (Start operation, Import, Browse Google Drive).
```jsx
<button className="flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-2.5 text-sm font-medium">
  <Icon className="w-4 h-4" /> Label
</button>
```
- Background: accent → accent-2 on hover. Text white. Radius `rounded-lg`. Padding `px-3 py-2.5` (or `py-3` for the big Start operation). Font `text-sm font-medium`.
- Disabled: `disabled:opacity-40 disabled:cursor-not-allowed`.

### Two-up action row (e.g. Workspace Import / Empty chapter)
```jsx
<div className="grid grid-cols-2 gap-2">
  <button className="... bg-[hsl(var(--c-accent))] ...">Import</button>
  <button className="... bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 ...">Empty chapter</button>
</div>
```
- Equal-width columns, `gap-2`. Destructive/secondary uses the rose-tinted soft style.

### Secondary / soft button
```jsx
<button className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5">
  <Icon className="w-3.5 h-3.5" /> Label
</button>
```
- Used for quick actions (Download OCR / Download TL, clear, etc.).

### Destructive button (running/stop)
```jsx
<button className="... bg-rose-500 hover:bg-rose-600 text-white ...">Stop operation</button>
```

### Icon-only button
```jsx
<button className="text-[hsl(var(--c-dim))] hover:text-rose-400 shrink-0" title="Remove chapter">
  <Trash2 className="w-4 h-4" />
</button>
```
- Hover typically shifts to `rose-400` for delete actions, or `text-[hsl(var(--c-text))]` for neutral toggles.

### Link-style text button
```jsx
<button className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-accent))] hover:opacity-80">
  <Plus className="w-3.5 h-3.5" /> Add images
</button>
```

### shadcn `Button` (from `@/components/ui/button`)
Used in forms/auth. Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
- Sizes: `default h-9 px-4 py-2`, `sm h-8 px-3 text-xs`, `lg h-10 px-8`, `icon h-9 w-9`.
- All buttons: `rounded-md`, `text-sm font-medium`, `gap-2`, `[&_svg]:size-4`.

### Button placement rules
- Primary actions sit at the **top of the content flow** in the Workspace, directly under the options card (Import / Empty chapter row, then full-width Start operation).
- Per-card action buttons (Run OCR / Translate) sit at the **bottom of the expanded chapter card**, full-width inside `flex-1`, stacked on mobile / side-by-side on `sm:flex-row`.
- Quick action chips (download) appear only when their target output exists, directly above the output preview.
- Icon-only controls (delete, expand, count badge) align to the **right edge** of a row; the expand chevron is leftmost.

---

## 4. Form Controls

### Text input
```jsx
<input className="w-full bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]" />
```
- Full width, `rounded-lg`, `px-3 py-2`. Focus ring = accent border (no outer ring).

### Inline title input (chapter row)
```jsx
<input className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-[hsl(var(--c-border))] focus:border-[hsl(var(--c-accent))] focus:outline-none px-1 py-1 text-sm ..." />
```

### Segment group (Output format)
```jsx
<div className="flex gap-1 p-1 bg-[hsl(var(--c-input))] rounded-lg border border-[hsl(var(--c-border))] w-fit">
  <button className="px-4 py-1.5 rounded-md text-sm font-mono ...">.txt</button>
</div>
```
- Active segment: `bg-[hsl(var(--c-accent))] text-white`. Inactive: `text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]`. `w-fit` (not full width).

### Toggle (Switch)
```jsx
<Switch checked={...} onCheckedChange={...} className="data-[state=checked]:bg-[hsl(var(--c-accent))]" />
```
- Checked state uses the accent color. Row layout: `flex items-center justify-between`, label left, switch right; split sections with `border-t pt-4`.

### Language select
- `LanguageSelect` from `@/components/batch/LanguageSelect`. Always an **empty, clear input** (text state is local; committed value shown only by its flag). Dropdown is a max-`h-56` scroll list with flag + name rows. See component for full spec.

### Labels
- `block text-xs text-[hsl(var(--c-dim))] mb-1.5` above inputs.

---

## 5. Status Badges & Progress

### Status badge (inline, in chapter row header)
```jsx
// running
<span className="text-xs text-[hsl(var(--c-accent))] flex items-center gap-1">
  <Loader2 className="w-3 h-3 animate-spin" /> OCR {progress}%
</span>
// done
<span className="text-xs text-emerald-400 flex items-center gap-1">OCR ✓</span>
// error
<span className="text-xs text-rose-400">OCR ✗</span>
```
- `text-xs`. Running = accent + spinner + percent. Done = emerald + check. Error = rose + ✗.

### Progress bar (under a running card)
```jsx
<div className="h-1 bg-[hsl(var(--c-soft))]">
  <div className="h-full bg-[hsl(var(--c-accent))] transition-all" style={{ width: `${progress}%` }} />
</div>
```

### Count chip
```jsx
<span className="hidden sm:flex items-center gap-1 text-xs text-[hsl(var(--c-dim))]">
  <Images className="w-3.5 h-3.5" /> {count}
</span>
```

---

## 6. Charts (Usage page) — DO NOT change these values

### Daily credits — Area chart
- Container: `h-64` inside a card `p-4`.
- `AreaChart` margin: `{ top: 5, right: 12, left: 0, bottom: 40 }`.
- Gradient `id="g1"`: accent `#7c6ff5`, 5% → 0.5 opacity, 95% → 0.05 opacity.
- `CartesianGrid`: `strokeDasharray="3 3"`, `stroke="hsl(217 33% 20%)"`, `vertical={false}`.
- `XAxis`: `dataKey="label"`, `tick fontSize: 10`, `fill: 'hsl(215 20% 55%)'`, **`interval={0}`** (show every day), `angle={-40}`, `textAnchor="end"`, `height={50}`, no tick/axis line.
- `YAxis`: `allowDecimals={false}`, `tick fontSize: 11`, `width={36}`, no tick/axis line. **width 36 + left margin 0 keeps all y-axis numbers visible — never clip.**
- `Area`: `type="monotone"`, `strokeWidth={2}`, `fill="url(#g1)"`.
- Tooltip style: `{ background: 'hsl(222 40% 12%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#e7e9f3', fontSize: 12 }`.

### Top series — Horizontal Bar chart
- Container: `h-56`. `BarChart layout="vertical"`, margin `{ top: 5, right: 16, left: 8, bottom: 0 }`.
- `YAxis type="category" dataKey="name" width={90}` (series names left-aligned under bars). `XAxis type="number"`.
- `Bar`: `fill={ACCENT}`, `radius={[0, 6, 6, 0]}`.
- Grid: `horizontal={false}`.

---

## 7. Icons

- Library: **lucide-react only**. Only import icons that exist.
- Standard sizing: `w-4 h-4` in buttons, `w-3.5 h-3.5` for inline badges/secondary, `w-5 h-5` for nav items, `w-8 h-8` for empty-state heroes.
- Accent icons (in labels/headers): `text-[hsl(var(--c-accent))]`.
- Always include `shrink-0` on icons in flex rows so they don't compress.

---

## 8. Workspace-Specific Conventions

- **Options card is always at the top**, above the chapter list.
- Import is a single unified button (opens a modal for local files + Google Drive). Icon: `Sparkles`.
- "Empty chapter" adds a blank chapter (icon `Trash2`, rose-tinted soft style). Do **not** rename to "Delete chapter".
- "Start operation" is full-width, accent when idle (`Play` icon) / rose when running (`Square` icon, "Stop operation").
- Chapters persist across page navigation (module-level store in `src/lib/workspaceStore.js`).
- Expand/hide-all toggle sits between the action buttons and the chapter list.
- Per-chapter: Run OCR (accent) and Translate (soft) are equal-width, side-by-side on `sm+`.
- Quick download chips (OCR / TL) show only when that output exists.

---

## 9. Responsive Rules

- Mobile-first. Every interactive row must work at 375px width.
- Use `flex-col sm:flex-row` to stack on mobile and align side-by-side on tablet+.
- Two-up button rows: `grid grid-cols-2 gap-2`.
- Hide non-essential chips on mobile with `hidden sm:flex` (e.g. image count).
- Bottom nav is fixed; main content has `pb-20 lg:pb-0` so it never hides behind the nav.
- Never introduce horizontal scroll: keep `document.documentElement.scrollWidth ≤ clientWidth + 2`.

---

## 10. Non-Negotiables

1. **Tokens only** for colors in JSX: `bg-[hsl(var(--c-*))]`, `text-[hsl(var(--c-*))]`. No `bg-white`, no hex (except the documented chart accent `#7c6ff5`).
2. **Radius**: `rounded-xl` for cards/containers, `rounded-lg` for buttons/inputs, `rounded-md` for small segments.
3. **Keep the midnight theme** as default. Theme switching is via `data-theme` only.
4. **Do not rename** core actions (Import, Empty chapter, Start operation, Run OCR, Translate) without an explicit request.
5. **Chart specs in section 6 are locked** — height, margins, axis widths, interval, angle are the agreed values.
6. When in doubt, match an existing component in this file rather than inventing a new pattern.