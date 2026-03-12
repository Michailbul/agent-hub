# V11 "Kiln" -- Design System Specification

> **Synthesized from:** Rumah Hangat (mobile app), Eallin Creative Engine (presentation slides), 21st.dev (component library), and 10 internal theme iterations (V3-V10)
> **Target:** Skills Lab UI -- card-based skill browser with categories, search, detail panels
> **Aesthetic position:** The tension line between brutalism and modern UI. Premium, editorial, slightly unconventional, fully usable.
> **Date:** 2026-03-12

---

## 0. Design Lineage & Rationale

This specification is the synthesis of four reference directions and the existing Agent Hub theme evolution:

| Reference | What it contributes | What we take |
|---|---|---|
| **Rumah Hangat** (mobile) | Warm earth tones, monospace ALL-CAPS headers, zigzag dividers, structured grid cards with solid color blocks | Terracotta palette, monospace label system, the "solid color block" card header pattern |
| **Timeline Slide** (presentation) | Pure black canvas, cyan/coral accent pops, down-arrow bullets, bold geometric contrast | High-contrast surface strategy, accent color as punctuation not decoration, label typesetting |
| **Architecture Slide** (presentation) | Dotted borders, window-chrome decorative elements, teal accent blocks, check-circle icons, side-by-side panel contrast | Dotted border language for containers, dual-tone panel system, status iconography |
| **21st.dev** (web app) | Clean grayscale base, subtle borders, rounded corners, left sidebar nav, card grid with tags/chips, clean hierarchy | Card grid layout, tag/chip component, sidebar navigation pattern, information hierarchy |
| **V8 Brutalist** (internal) | 0-radius everything, 2px borders, offset hard shadows, terracotta #d97757, JetBrains Mono | The brutalist skeleton that all dark variants build on |
| **V9 Oxide** (internal) | Pure black #000, restrained terracotta as rgba tints, 1px borders, minimal weight | Restraint -- proving that less terracotta = more premium |
| **V10 Slab** (internal) | 3px borders, 800-weight type, terracotta header bars, grid underlay | Maximum brutalist expression -- the ceiling we pull back from |

### The V11 Position

V11 sits at approximately **60% Oxide restraint + 30% Slab structure + 10% Rumah Hangat warmth**. The key insight from the references: brutalism works best when it is *selective*. A single hard shadow on the hero element is worth more than hard shadows on everything. The 21st.dev reference proves that brutalist typography (monospace, uppercase, tracked) can coexist with clean modern layout if spacing and surface treatment are refined.

---

## 1. Color Palette

### 1.1 Surfaces (Dark Mode -- Primary)

| Token | Hex | Usage |
|---|---|---|
| `--surface-canvas` | `#0C0C0A` | Full-bleed app background. Near-black with warm undertone. |
| `--surface-0` | `#141311` | Panel backgrounds, primary containers. |
| `--surface-1` | `#1C1B18` | Card backgrounds, elevated containers. |
| `--surface-2` | `#252420` | Input fields, nested containers, search bars. |
| `--surface-3` | `#2E2D28` | Hover states on surface-1, subtle differentiation. |
| `--surface-raised` | `#343330` | Tooltips, dropdowns, popovers. |

**Rationale:** The progression is deliberately narrow (only 4 steps from 0C to 34). This creates the "everything is dark but nothing is flat" effect seen in the timeline slides. The warm undertone (#0A vs #0F) connects to Rumah Hangat without being visible.

### 1.2 Borders

| Token | Hex / RGBA | Usage |
|---|---|---|
| `--border-subtle` | `rgba(217, 119, 87, 0.06)` | Dividers within panels, separator lines. |
| `--border-default` | `rgba(217, 119, 87, 0.12)` | Panel borders, card borders at rest. |
| `--border-strong` | `#3E3E38` | Focused panel borders, active containers. V8/V10 heritage. |
| `--border-accent` | `#D97757` | Active tab indicators, focused inputs, selected items. |
| `--border-dotted` | `rgba(217, 119, 87, 0.15)` | Container outlines for grouping (from Architecture slide). Use `border-style: dashed; border-dasharray: 4 4`. |

### 1.3 Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#E8E2D8` | Headings, selected item names, primary content. Warm cream, not pure white. |
| `--text-secondary` | `#B5ADA0` | Body text, descriptions, secondary labels. |
| `--text-tertiary` | `#7A7468` | Metadata, timestamps, inactive tabs, path breadcrumbs. |
| `--text-ghost` | `#4A4640` | Placeholder text, disabled states, decorative labels. |
| `--text-inverse` | `#141311` | Text on terracotta backgrounds (buttons, badges, header bars). |

**Rationale:** No pure white (#FFF) anywhere in the dark theme. The warmest text color is #E8E2D8 -- this is the Rumah Hangat influence. The 21st.dev reference uses true gray; we shift every gray warm by 3-5 degrees.

### 1.4 Accent (Terracotta Ramp)

| Token | Hex | Usage |
|---|---|---|
| `--accent-subtle` | `rgba(217, 119, 87, 0.06)` | Hover backgrounds, tinted containers. |
| `--accent-muted` | `rgba(217, 119, 87, 0.12)` | Active/selected row backgrounds. |
| `--accent-default` | `#D97757` | Primary accent. Tab indicators, badges, active borders, icon color. |
| `--accent-hover` | `#E08868` | Hover state for accent-colored elements. |
| `--accent-bold` | `#EB9A7A` | High-emphasis text accent (used sparingly -- stat numbers, alert counts). |

### 1.5 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--status-active` | `#D97757` | Running, active, in-progress. |
| `--status-success` | `#4A9B6E` | Deployed, healthy, synced. Muted green, not neon. |
| `--status-warning` | `#C9923E` | Degraded, pending review. Warm amber. |
| `--status-error` | `#C44D4D` | Failed, broken, absent. Muted red, not emergency. |
| `--status-info` | `#5A8AB5` | Informational, neutral status. Steel blue. |

### 1.6 Light Mode (Secondary -- for Brand/Default variant)

The existing `default-brand.css` light mode is retained with its paper-stack palette. V11 dark is the primary theme; light mode inherits from the existing `--paper` / `--coral` / `--ink` system in `index.css`. No changes to light mode are proposed here.

---

## 2. Typography

### 2.1 Font Stack

```css
--font-display: 'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace;
--font-body: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

**Rationale:** The monospace/sans-serif split is the single most important typographic decision. From the references:
- Rumah Hangat uses monospace *everywhere* -- this creates the brutalist feel but hurts readability at body sizes
- 21st.dev uses sans-serif everywhere -- clean but loses character
- The timeline slides mix monospace labels with sans-serif body -- this is the sweet spot

**Rule:** Monospace is for *labels, identifiers, metadata, and navigation*. Sans-serif is for *descriptions, body copy, and natural language*. Never mix within the same visual line.

### 2.2 Type Scale

| Level | Font | Size | Weight | Letter-Spacing | Transform | Usage |
|---|---|---|---|---|---|---|
| **Display** | `--font-display` | 28px | 800 | -0.03em | uppercase | Welcome screen title, empty states |
| **Section Label** | `--font-display` | 11px | 700 | 0.14em | uppercase | Panel titles, section headers ("NAVIGATOR", "INSPECTOR") |
| **Tab Label** | `--font-display` | 12px | 600 | 0.08em | uppercase | Tab navigation items |
| **Card Title** | `--font-body` | 14px | 600 | -0.01em | none | Skill names, agent names in cards |
| **Body** | `--font-body` | 13px | 400 | -0.005em | none | Descriptions, long-form content |
| **Small Body** | `--font-body` | 12px | 400 | 0em | none | Metadata values, secondary info |
| **Caption** | `--font-display` | 10px | 600 | 0.1em | uppercase | Meta keys, department labels, stat labels |
| **Micro** | `--font-display` | 9px | 500 | 0.12em | uppercase | Timestamps, build hashes, tertiary metadata |
| **Code** | `--font-mono` | 13px | 400 | 0em | none | File paths, code snippets, inline code |

### 2.3 Typography Rules

1. **ALL-CAPS with tracking is reserved for monospace labels only.** Never apply uppercase+tracking to Inter body text. This is the Rumah Hangat rule.
2. **Letter-spacing is always positive for uppercase monospace, always negative or zero for mixed-case sans-serif.** The contrast between tracked-out labels and tight body text creates the editorial feel.
3. **Line-height:** 1.0 for labels/captions (single-line only), 1.5 for body text, 1.6 for multiline descriptions.
4. **Maximum line length:** 65ch for body text, unconstrained for labels.

---

## 3. Spacing & Layout

### 3.1 Spacing Scale

```
4px   -- micro gap (icon to label, dot to text)
8px   -- tight gap (between related items within a row)
12px  -- default gap (between sibling elements)
16px  -- section gap (between distinct sections within a panel)
20px  -- panel padding (consistent horizontal padding in all panels)
24px  -- panel gap (between panels)
32px  -- major section break
40px  -- canvas inset from viewport edges
```

**Rationale:** The scale is intentionally limited (no 6, 10, 14, 18 steps). This constraint forces visual consistency. The 20px panel padding is sacred -- it matches V8/V9/V10 and the Rumah Hangat horizontal margins.

### 3.2 Grid System

```
Canvas inset:    20px all sides
Panel gap:       24px (increased from V7's 12px per PRD-skills-lab-design.md)
Panel min-width: Navigator 300px, Editor flex-1, Inspector 320px
```

**Card Grid (for skill browser / category views):**
```
Columns:         auto-fill, minmax(280px, 1fr)
Gap:             16px
Card padding:    20px
Card min-height: 160px
```

This card grid draws from 21st.dev's template gallery layout. The `minmax(280px, 1fr)` ensures cards never get too narrow for their content while filling available space.

### 3.3 Panel Architecture

```
+--[Navigator 300px]--+--24px--+--[Editor flex-1]--+--24px--+--[Inspector 320px]--+
|                     |        |                    |        |                      |
| .panel-header       |        | .panel-header      |        | .panel-header        |
| .nav-controls       |        | .editor-header     |        | .meta-section        |
|   .nav-tabs         |        | .editor-body       |        | .meta-section        |
|   .search-bar       |        |   (CodeMirror)     |        | .meta-group          |
| .nav-tree           |        |                    |        | .meta-actions        |
| .nav-depts          |        |                    |        |                      |
+---------------------+        +--------------------+        +----------------------+
```

**Visual Hierarchy via Border Weight:**
- Navigator: `border: 1px solid var(--border-default)` -- subtle, structural
- Editor: `border: 2px solid var(--border-strong)` -- primary focus, heavier
- Inspector: `border: 1px solid var(--border-default)` -- matches navigator

This resolves the PRD critique about "all panels equally loud."

---

## 4. Component Patterns

### 4.1 Cards

**Skill Card (Grid View)**
```
+-----------------------------------------------+
| [Category Color Block 4px top border]          |
|                                                |
|  SKILL NAME                     14px/600 Inter |
|  Description text here that     13px/400 Inter |
|  wraps to two lines max...      --text-secondary|
|                                                |
|  [tag] [tag] [tag]             10px JBM pills  |
|                                                |
|  AGENT · DEPT                  10px JBM ghost  |
+-----------------------------------------------+
```

Properties:
- Background: `var(--surface-1)`
- Border: `1px solid var(--border-default)`
- Border-top: `4px solid {category-color}` -- the Rumah Hangat solid color block influence
- Border-radius: `0` (brutalist) OR `2px` (slight concession to 21st.dev)
- Shadow (rest): none
- Shadow (hover): `4px 4px 0 0 rgba(217,119,87,0.15)` -- hard shadow appears on hover only
- Transform (hover): `translate(-2px, -2px)` -- the lift from V8/V10
- Padding: `20px`
- Gap (internal): `12px` between title, description, tags

**Category Color Blocks** (top border of cards):
```
--cat-automation:  #D97757   (terracotta -- default/primary)
--cat-analysis:    #5A8AB5   (steel blue)
--cat-content:     #4A9B6E   (sage green -- from Rumah Hangat's olive)
--cat-integration: #C9923E   (warm amber)
--cat-system:      #7A7468   (warm gray)
--cat-creative:    #9B6B8E   (muted plum)
```

### 4.2 Buttons

**Primary Button**
```css
.btn-primary {
  background: var(--accent-default);      /* #D97757 */
  color: var(--text-inverse);             /* #141311 */
  border: 2px solid var(--accent-default);
  border-radius: 0;
  padding: 10px 20px;
  font: 700 10px/1 var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  box-shadow: 3px 3px 0 0 rgba(217,119,87,0.35);
  cursor: pointer;
  transition: all 100ms ease;
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 0 rgba(217,119,87,0.4);
}
.btn-primary:active {
  transform: translate(0, 0);
  box-shadow: 1px 1px 0 0 rgba(217,119,87,0.3);
}
```

**Secondary/Ghost Button**
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: 0;
  padding: 10px 20px;
  font: 600 10px/1 var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 100ms ease;
}
.btn-ghost:hover {
  border-color: var(--accent-default);
  color: var(--text-primary);
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0 0 rgba(217,119,87,0.15);
}
```

**Danger Button**
```css
.btn-danger {
  /* Inherits ghost style */
  color: var(--text-ghost);
}
.btn-danger:hover {
  color: var(--status-error);
  border-color: var(--status-error);
  box-shadow: 2px 2px 0 0 rgba(196,77,77,0.15);
}
```

**CTA Button** (from 21st.dev "Get started" arrow pattern)
```css
.btn-cta {
  /* Extends primary */
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-cta::after {
  content: '\2192';   /* right arrow */
  transition: transform 150ms ease;
}
.btn-cta:hover::after {
  transform: translateX(3px);
}
```

### 4.3 Input / Search Bar

```css
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 2px solid var(--border-strong);
  border-radius: 0;
  padding: 0 14px;
  height: 40px;
  transition: border-color 100ms ease, box-shadow 100ms ease;
}
.search-bar:focus-within {
  border-color: var(--accent-default);
  box-shadow: 0 0 0 3px rgba(217,119,87,0.08);
  /* Soft glow instead of hard shadow -- per PRD P2 recommendation */
}
.search-bar input {
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font: 400 13px var(--font-body);
  width: 100%;
}
.search-bar input::placeholder {
  color: var(--text-ghost);
  font: 500 11px var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

The placeholder uses monospace uppercase (Rumah Hangat influence) while typed content uses sans-serif -- this creates a satisfying visual transition as the user types.

### 4.4 Navigation / Tabs

```css
.nav-tab {
  background: none;
  border: none;
  padding: 10px 0;
  margin-right: 24px;
  font: 600 12px var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-ghost);
  cursor: pointer;
  position: relative;
  transition: color 120ms ease;
}
.nav-tab:hover {
  color: var(--text-secondary);
}
.nav-tab.active {
  color: var(--accent-default);
}
.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;             /* Thick slab indicator -- V10 heritage */
  background: var(--accent-default);
}
```

### 4.5 Tags / Chips

```css
.tag {
  display: inline-flex;
  align-items: center;
  font: 500 10px var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: 0;
  padding: 4px 10px;
  transition: all 100ms ease;
}
.tag:hover {
  border-color: var(--accent-default);
  color: var(--text-primary);
}
.tag.active {
  background: var(--accent-default);
  border-color: var(--accent-default);
  color: var(--text-inverse);
}
```

**Department Pill** (filterable, more prominent than tags):
```css
.dept-pill {
  /* Extends .tag */
  padding: 6px 14px;
  border-width: 2px;
  font-weight: 700;
}
.dept-pill:hover {
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0 0 rgba(217,119,87,0.2);
}
.dept-pill.active {
  box-shadow: 2px 2px 0 0 rgba(217,119,87,0.35);
}
```

### 4.6 Panel Header

**Navigator / Inspector (Secondary panels)**
```css
.panel-header--secondary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
  /* No background fill -- just structural */
}
.panel-title--secondary {
  font: 700 11px var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-ghost);
  /* Ghost color, not accent -- defers to editor */
}
```

**Editor (Primary panel)**
```css
.panel-header--primary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: var(--accent-default);
  /* Solid terracotta -- the ONE loud header. Per PRD hierarchy fix. */
}
.panel-title--primary {
  font: 800 13px var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-inverse);
}
```

### 4.7 Status Indicator Dot

```css
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 0;          /* Square dots -- brutalist */
  flex-shrink: 0;
  transition: background 100ms ease;
}
.status-dot--active   { background: var(--status-active); }
.status-dot--success  { background: var(--status-success); }
.status-dot--error    { background: var(--status-error); }
.status-dot--inactive { background: var(--border-strong); }
```

Square dots (border-radius: 0) are a V8/V10 signature. They read as "intentionally different" from standard UI circles and reinforce the brutalist identity.

### 4.8 Dividers

**Standard:**
```css
.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0;
}
```

**Decorative (Rumah Hangat zigzag influence -- use sparingly):**
```css
.divider--decorative {
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    var(--accent-default) 0px,
    var(--accent-default) 8px,
    transparent 8px,
    transparent 16px
  );
  opacity: 0.3;
}
```

This translates the Rumah Hangat zigzag/sawtooth pattern into a CSS-native dashed strip. It works as a section break in the Inspector panel between major sections.

---

## 5. Visual Language

### 5.1 Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-none` | `none` | Default state for secondary panels. |
| `--shadow-hard-sm` | `2px 2px 0 0 rgba(217,119,87,0.15)` | Tags on hover, ghost buttons on hover. |
| `--shadow-hard` | `4px 4px 0 0 rgba(217,119,87,0.25)` | Primary panel, cards on hover, focused inputs. |
| `--shadow-hard-lg` | `6px 6px 0 0 rgba(217,119,87,0.3)` | Focused/active primary panel. |
| `--shadow-hard-xl` | `8px 8px 0 0 rgba(217,119,87,0.35)` | Reserved for dragging state, modal panels. |
| `--shadow-glow` | `0 0 0 3px rgba(217,119,87,0.08)` | Focus rings, search bar focus. |

**Rule:** Hard shadows are ALWAYS terracotta-tinted. Never use neutral gray hard shadows. This is what makes the brutalism feel warm rather than cold. The Rumah Hangat palette and the V8 shadow system agree on this.

**Rule:** Hard shadows only appear on interactive hover or focus states -- never at rest (except the primary editor panel). This is the V9 Oxide lesson: restraint makes the moments of brutalism more impactful.

### 5.2 Border Radius

```
0px   -- Panels, buttons, inputs, tags, cards, dots, scrollbar thumbs
0px   -- EVERYTHING
```

The only exception: `border-radius: 2px` may be applied to tooltips and dropdown menus for collision-avoidance at viewport edges.

This is the single strongest brutalist signal. When the 21st.dev reference uses 8-12px radius and we use 0px, the contrast creates the "premium but different" feeling.

### 5.3 Hover & Interaction States

**The Lift Pattern** (signature interaction from V8/V10):
```css
.interactive:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hard);
}
.interactive:active {
  transform: translate(0, 0);
  box-shadow: var(--shadow-hard-sm);
}
```

This creates a physical "press" metaphor: hover lifts the element up-left, and the hard shadow appears below-right as if light is casting from the top-left. Clicking pushes it back down.

**Row Selection** (sidebar navigation):
```css
.nav-row {
  border-left: 3px solid transparent;
  transition: all 100ms ease;
}
.nav-row:hover {
  background: var(--accent-subtle);
}
.nav-row.active {
  background: var(--accent-muted);
  border-left-color: var(--accent-default);
  color: var(--text-primary);
}
```

The left-border indicator is inherited from V8/V9/V10 and mirrors the tab bottom-border pattern for consistency.

### 5.4 Transitions

```css
--transition-instant: 80ms ease;    /* Color changes, opacity */
--transition-fast: 120ms ease;      /* Border changes, background shifts */
--transition-normal: 200ms ease;    /* Transform, shadow, panel animations */
--transition-slow: 300ms ease;      /* Panel mount/unmount, welcome state */
```

**Rule:** Never use transition durations above 300ms. The app should feel *immediate*. The presentation slides have zero animation -- that crispness is aspirational.

### 5.5 Grid Underlay (from V10 Slab)

```css
.canvas::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(217,119,87,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(217,119,87,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
```

The 40px grid at 2.5% opacity creates a subtle "graph paper" feel that reinforces the structured/architectural nature of the tool without being visible enough to distract. This is a nod to the Architecture slide's structured layout.

### 5.6 Scrollbars

```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 0;           /* Square scrollbar thumb -- matches everything else */
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-default);
}
```

### 5.7 Window Chrome Dots (Decorative -- from Architecture Slide)

For panel headers or section headers where extra visual interest is needed:

```css
.chrome-dots {
  display: flex;
  gap: 6px;
}
.chrome-dots::before,
.chrome-dots::after,
.chrome-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;   /* Exception to 0-radius rule: these reference macOS chrome */
}
.chrome-dots::before { content: ''; background: var(--status-error); opacity: 0.6; }
.chrome-dots span    { background: var(--status-warning); opacity: 0.6; }
.chrome-dots::after  { content: ''; background: var(--status-success); opacity: 0.6; }
```

Use sparingly -- only on the primary editor panel header, never repeated.

---

## 6. Key Principles

### 6.1 Selective Brutalism

Brutalism is a spice, not the main course. The system has exactly three brutalist signals:

1. **Zero border-radius** on all components
2. **Hard offset shadows** on hover/focus states (terracotta-tinted)
3. **Monospace uppercase tracked labels** for navigation and metadata

Everything else -- spacing, information hierarchy, interaction patterns -- follows modern UI best practices. The brutalism creates identity; the modern patterns create usability.

### 6.2 The Warm Machine

The entire palette is warm. Every gray has a brown/amber undertone. Every accent is terracotta. This is the difference between "brutalist code tool" (cold, intimidating) and "brutalist craft studio" (warm, intentional). Rumah Hangat's earth tones taught this lesson: warmth and structure are not opposites.

### 6.3 Monospace as Rank, Not Decoration

JetBrains Mono is used to signal *system-level information*: section labels, navigation tabs, metadata keys, file paths, status indicators. Inter is used for *human-level information*: descriptions, names, body copy. This creates two distinct "voices" in the UI that help users instantly categorize what they are reading.

### 6.4 One Hero, Many Servants

From the PRD critique: only the Editor panel gets the full treatment (terracotta header, heavier border, active hard shadow). Navigator and Inspector are deliberately quieter. This principle extends to every screen: identify the ONE element that should be loudest, and make everything else defer to it.

### 6.5 Shadow as State, Not Style

Hard shadows are never decorative -- they only appear in response to user interaction (hover, focus, drag) or to indicate the active/focused panel. At rest, the interface is flat. This makes every shadow meaningful and every interaction feel physical.

### 6.6 The Editorial Grid

Content is organized in structured, repeating patterns with consistent spacing. The 21st.dev card grid, the Rumah Hangat category layout, and the timeline's vertical structure all share this quality: rigorous alignment with generous whitespace. The spacing scale (4/8/12/16/20/24/32/40) enforces this.

---

## 7. Component Token Summary (CSS Custom Properties)

```css
:root {
  /* Surfaces */
  --surface-canvas: #0C0C0A;
  --surface-0: #141311;
  --surface-1: #1C1B18;
  --surface-2: #252420;
  --surface-3: #2E2D28;
  --surface-raised: #343330;

  /* Borders */
  --border-subtle: rgba(217, 119, 87, 0.06);
  --border-default: rgba(217, 119, 87, 0.12);
  --border-strong: #3E3E38;
  --border-accent: #D97757;

  /* Text */
  --text-primary: #E8E2D8;
  --text-secondary: #B5ADA0;
  --text-tertiary: #7A7468;
  --text-ghost: #4A4640;
  --text-inverse: #141311;

  /* Accent */
  --accent-subtle: rgba(217, 119, 87, 0.06);
  --accent-muted: rgba(217, 119, 87, 0.12);
  --accent-default: #D97757;
  --accent-hover: #E08868;
  --accent-bold: #EB9A7A;

  /* Status */
  --status-active: #D97757;
  --status-success: #4A9B6E;
  --status-warning: #C9923E;
  --status-error: #C44D4D;
  --status-info: #5A8AB5;

  /* Category Colors */
  --cat-automation: #D97757;
  --cat-analysis: #5A8AB5;
  --cat-content: #4A9B6E;
  --cat-integration: #C9923E;
  --cat-system: #7A7468;
  --cat-creative: #9B6B8E;

  /* Typography */
  --font-display: 'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Shadows */
  --shadow-hard-sm: 2px 2px 0 0 rgba(217, 119, 87, 0.15);
  --shadow-hard: 4px 4px 0 0 rgba(217, 119, 87, 0.25);
  --shadow-hard-lg: 6px 6px 0 0 rgba(217, 119, 87, 0.3);
  --shadow-hard-xl: 8px 8px 0 0 rgba(217, 119, 87, 0.35);
  --shadow-glow: 0 0 0 3px rgba(217, 119, 87, 0.08);

  /* Transitions */
  --transition-instant: 80ms ease;
  --transition-fast: 120ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Layout */
  --panel-padding: 20px;
  --panel-gap: 24px;
  --canvas-inset: 20px;
  --nav-width: 300px;
  --inspector-width: 320px;
  --card-min-width: 280px;
  --card-gap: 16px;
}
```

---

## 8. Applying to Skills Lab Screens

### 8.1 Skill Browser (Default View)

```
+--[Navigator]------+--24px--+--[Skill Grid]----------------------------------+
| SKILLS LAB  (42)  |        | ALL SKILLS                                     |
|                   |        | Browse and install skills for your agents       |
| [Agents] [Sources]|        |                                                |
| [Search........]  |        | +--card--+ +--card--+ +--card--+ +--card--+   |
|                   |        | |████████| |████████| |████████| |████████|   |
| > Agent Alpha (8) |        | |        | |        | |        | |        |   |
|   - skill-a       |        | | Name   | | Name   | | Name   | | Name   |   |
|   - skill-b       |        | | desc.. | | desc.. | | desc.. | | desc.. |   |
| > Agent Beta (5)  |        | | [tag]  | | [tag]  | | [tag]  | | [tag]  |   |
|   - skill-c       |        | +--------+ +--------+ +--------+ +--------+   |
|                   |        |                                                |
| ─────────────── |        | +--card--+ +--card--+ +--card--+ +--card--+   |
| DEPARTMENTS       |        | |████████| |████████| |████████| |████████|   |
| [Auto] [Content]  |        | ...                                            |
| [System] [Int.]   |        |                                                |
+-------------------+        +------------------------------------------------+
```

### 8.2 Skill Detail (Editor Open)

```
+--[Navigator]--+--24px--+--[Editor]----------------------------+--24px--+--[Inspector]--+
| (same as      |        | < SKILL.MD   deploy-automation.skill  |        | NAME          |
|  above,       |        | ─────────────────────────────────────|        | Deploy Auto.. |
|  dimmed)      |        | yaml: true                           |        |               |
|               |        | modified: 2d ago                     |        | DEPARTMENT    |
|               |        | ─────────────────────────────────────|        | Automation    |
|               |        |                                      |        |               |
|               |        | # Deploy Automation                  |        | TAGS          |
|               |        |                                      |        | [ci] [deploy] |
|               |        | This skill handles...                |        |               |
|               |        |                                      |        | AGENTS        |
|               |        |                                      |        | Alpha · Beta  |
|               |        |                                      |        |               |
|               |        |                                      |        | [Deploy >>>]  |
|               |        |                                      |        | [Dup] [Move]  |
|               |        |                                      |        | [Delete]      |
+---------------+        +--------------------------------------+        +---------------+
```

---

## 9. Migration Notes from V7/V8/V9/V10

| V7 Clay Element | V11 Kiln Change | Reason |
|---|---|---|
| All panels: 2px border + hard shadow | Nav/Inspector: 1px border, no shadow. Editor: 2px + shadow. | Visual hierarchy (PRD P1) |
| All panels: terracotta header bar | Only Editor gets terracotta header | Reduce accent competition (PRD P1) |
| Panel gap: 12px | 24px | Breathing room (PRD P0, done) |
| Deploy button: 1/2 grid | Full-width `grid-column: 1 / -1` | Primary action prominence (PRD P1) |
| Back button: filled dark square | Ghost style, terracotta border | Reduce visual weight (PRD P1) |
| Meta keys: 10px | 9px, dimmer color `--text-ghost` | Data density improvement (PRD P2) |
| Search focus: border-color only | Border-color + `--shadow-glow` ring | Focus visibility (PRD P2) |
| Welcome state: static | Pulse animation on icon, keyboard hint | Engagement (PRD P2) |

---

## 10. What This System Is NOT

- **Not a dark theme skin.** It is a complete visual language with specific rules about when to use monospace vs sans-serif, when shadows appear, and how hierarchy is communicated.
- **Not maximally brutalist.** V10 Slab is the ceiling. V11 pulls back to find the point where brutalism adds identity without harming usability.
- **Not warm for warmth's sake.** The warm tones exist because the product is about *craft* (building agent skills), not *ops* (monitoring servers). The palette communicates "workshop" rather than "control room."
- **Not a component library.** This is a specification. Implementation should target the existing CSS architecture (prefixed classes like `kn-` for Kiln, following the V7 `cl-`, V8 `bt-`, V9 `ox-`, V10 `sb-` convention).
