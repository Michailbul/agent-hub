# PRD: Skills Lab Design Refinement

**Status:** Proposed
**Component:** SkillsLab / V7Clay
**File:** `client/src/components/SkillsLab/v7-clay.css`

---

## Current State

Three-panel layout (Navigator + Editor + Inspector) on a dark charcoal canvas with terracotta (#d97757) accent. Hard shadows, 0px radius, monospace labels — Clay brutalist aesthetic.

---

## Design Critique

### What works
- Dark palette is cohesive and distinctive
- Terracotta accent is strong and memorable
- Three-panel layout gives clear information hierarchy
- JetBrains Mono labels create a "developer tool" feel
- Focus/dimmed panel states add depth without modals

### Issues to fix

#### 1. Visual Weight Distribution
**Problem:** All three panels have identical treatment — 2px border + hard shadow + terracotta header bar. When everything is equally "loud," nothing guides the eye.
**Fix:** Make the Editor panel the hero. Remove the hard shadow from Navigator and Inspector (keep border only). Give the Editor a slightly larger shadow or a 3px left-border accent instead of the full terracotta header.

#### 2. Terracotta Header Overuse
**Problem:** Two or three solid terracotta bars across the top of each panel compete for attention. It's the most saturated element and it appears 3x simultaneously.
**Fix:** Reserve the solid terracotta header for the Editor only. Navigator and Inspector get a thinner treatment — e.g., a 3px terracotta top-border or just a terracotta dot next to the title. The hierarchy becomes: Editor (primary) > Navigator (secondary) > Inspector (tertiary).

#### 3. Navigator Internal Spacing
**Problem:** The header + tabs + search stack feels compressed. The Agents/Sources tabs sit too close to the search input, and the search input is tight against the tree below.
**Fix:** Add 4px more gap between tabs and search (current 12px → 16px). Add a subtle 1px separator between the search area and the tree list.

#### 4. Department Pills Footer
**Problem:** The department pills at the bottom of the Navigator feel disconnected — they're jammed against the tree with only a 2px border as separator. They don't look clickable enough.
**Fix:** Increase footer top-padding from 14px → 18px. Consider making active pills invert with a slight lift animation to reinforce interactivity.

#### 5. Inspector Data Density
**Problem:** The metadata rows (Name, Dept, Source, Author) and the Presence list are dense. Every row looks the same weight.
**Fix:** Make meta keys slightly smaller (10px → 9px) and use a dimmer color. Increase row padding from 8px → 10px. Add a small horizontal rule between the key-value section and the "Tags" section.

#### 6. Editor Header Hierarchy
**Problem:** The back arrow, "SKILL.MD", and the skill name all sit on the terracotta bar at the same visual weight.
**Fix:** The filename "SKILL.MD" should be prominent (keep current weight). The skill display name should be clearly secondary — lighter color, smaller size. The back button should be a ghost/outline style, not a filled dark square.

#### 7. Action Buttons Grid
**Problem:** Deploy, Duplicate, Move to, Delete are in a 2x2 grid — all same size, same weight. "Deploy" (primary action) doesn't stand out enough from "Delete" (destructive).
**Fix:** Make Deploy full-width (spans 2 columns). Make Delete visually distinct — red border only on hover, dimmer default state.

#### 8. Welcome State
**Problem:** When no skill is selected, the welcome state ("Skills Lab / Select a skill...") is centered in the editor area but feels sparse.
**Fix:** Add a subtle animated terracotta pulse on the feather icon. Add keyboard hint: "Press ↓ to browse skills". Consider showing recent/popular skills as quick-launch chips.

---

## Proposed Changes (Priority Order)

### P0 — Quick spacing fixes (CSS only)
- [x] Panel gap 12px → 20px *(done)*
- [x] Panel inset 20px → `16px 24px 24px` *(done)*
- [x] Topbar dark theme integration *(done)*
- [ ] Navigator controls gap 12px → 16px
- [ ] Inspector meta row padding 8px → 10px
- [ ] Department footer padding 14px → 18px

### P1 — Visual hierarchy (CSS only)
- [ ] Remove hard shadow from Navigator + Inspector panels
- [ ] Editor: keep terracotta header, Nav/Inspector: switch to terracotta top-border only (3px)
- [ ] Deploy button: `grid-column: 1 / -1` to span full width
- [ ] Back button: ghost style (transparent bg, terracotta border)

### P2 — Polish (CSS + minor TSX)
- [ ] Welcome state: keyboard hint text, feather icon pulse
- [ ] Meta keys: 9px, dimmer color
- [ ] Skill indicator dot: animate on selection (scale pulse)
- [ ] Search bar: slight glow on focus instead of just border-color shift

### P3 — Aspirational (requires component changes)
- [ ] Quick-launch chips in welcome state (recent skills)
- [ ] Keyboard navigation (↑/↓ to browse skills, Enter to select)
- [ ] Collapsible Inspector sections (click group label to toggle)
- [ ] Drag-to-resize panel widths
