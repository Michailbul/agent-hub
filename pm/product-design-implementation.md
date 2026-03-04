# Agent Hub — Product Design Implementation Plan

> Based on `pm/product-design.md` · Architecture: React 19 + Vite 7 + Zustand 5 + CodeMirror 6 + Express 4
> Generated 2026-03-04

---

## 0. Current State Assessment

### What exists today (v0.2)
| Area | Status | Key files |
|---|---|---|
| **Top-level tabs** | Files + Crons (no Canvas shell) | `App.tsx:22` — `activeView` state is `'editor' \| 'crons'` |
| **Files editor** | Multi-pane CodeMirror, drag/resize dividers, max 4 panes | `PaneManager.tsx`, `Pane.tsx`, `CMEditor.tsx` |
| **Sidebar/tree** | Agent sections, skill libraries, source filter, context menu | `Sidebar.tsx`, `FileItem.tsx`, `ContextMenu.tsx` |
| **Crons layout** | 3-column: list (resizable) + detail + skills rail (resizable, collapsible) | `CronsPanel.tsx` — `useResizablePane` for both |
| **Prompt composer** | Plain textarea with regex skill detection `[skill: name]`, `/skill` autocomplete | `PromptComposer.tsx` — text-based, not chip-based |
| **Skills drawer** | Search, category filter, skill preview (raw `<pre>`), drag-to-insert, `+` insert button | `SkillsDrawer.tsx` |
| **Job editor** | Name, schedule, payload, delivery, wake mode, session target | `CronDetail.tsx` |
| **Backend APIs** | `/api/tree`, `/api/file`, `/api/crons` CRUD, `/api/skill/*`, `/api/login` | `src/server.ts` |
| **State mgmt** | `panes.ts` (editor), `auth.ts`, `ui.ts` (filter, toast) | No crons store — CronsPanel owns local state |
| **Design system** | CSS variables (paper/coral/ink), brutalist shadows, Inter + JetBrains Mono | `index.css` (~5700 lines) |

### Gap analysis vs product-design.md
| Design spec feature | Gap |
|---|---|
| Canvas tab shell | Not started — `activeView` union doesn't include `'canvas'` |
| Standardized click/drag/drop interaction contract | Partially implicit; no explicit contract enforcement or tooltips |
| Pane width persistence across reload | Pane dividers use percentage flex; widths not stored in localStorage |
| Chip-based prompt composer | Current composer is a `<textarea>` with regex detection — not a block/chip model |
| `/skill` + `@` + `/file` + `/var` autocomplete | Only `/skill` exists |
| Skill preview with rendered markdown + metadata | Preview is raw `<pre>` text, no rendered markdown, no metadata panel |
| WYSIWYG markdown editor (TipTap) | Not started — all files use CodeMirror |
| Canvas spatial modeler | Not started |
| Crons store (Zustand) | Jobs state is local to `CronsPanel` — not shared across components |
| Validation (cron expression, required fields, disabled save) | Minimal — no inline validation, save always enabled |

---

## 1. Prioritized Roadmap

### Priority framework
Decisions weighted by: (A) unblocks other work, (B) fixes user-facing friction today, (C) builds toward product thesis, (D) implementation effort.

### Sequence

```
Week 1-2:  v0.3  Foundation + Interaction Contract
Week 2-4:  v0.4a Chip-based Composer + Crons Store
Week 3-5:  v0.4b Canvas Shell + Agent Cards MVP
Week 4-6:  v0.5  TipTap WYSIWYG Editor
Week 6-7:  v0.6  Canvas Links + Inspector (stretch)
```

#### v0.3 — Foundation + Interaction Contract (HIGH, do first)
| # | Task | Effort | Why first |
|---|---|---|---|
| 3.1 | Add Canvas tab shell to TopBar + App routing | S | Unblocks Canvas work, cheap |
| 3.2 | Extract Crons state into Zustand `cronsStore` | M | Unblocks composer refactor + cross-component access |
| 3.3 | Persist pane widths in localStorage (Files + Crons) | S | UX friction fix — layout resets on reload |
| 3.4 | Standardize drag/drop rules: drop preview ghost, Enter/Escape contract | M | Foundation for chip composer + canvas |
| 3.5 | Interaction tooltips (first-use hints for pane drag, skill insert) | S | Acceptance criteria for v0.3 |

#### v0.4a — Chip-based Composer + Skills Polish (HIGH)
| # | Task | Effort | Depends on |
|---|---|---|---|
| 4.1 | Replace `<textarea>` composer with block-model: `ComposerBlock[]` (text, skill-chip, file-chip, var-chip) | L | 3.2, 3.4 |
| 4.2 | Chip rendering: inline chips with type icon, `×` remove, click-to-inspect | M | 4.1 |
| 4.3 | `/skill`, `/file`, `/var` autocomplete menus with keyboard nav | M | 4.1 |
| 4.4 | `@`-mention agents/files for chip insertion | S | 4.1 |
| 4.5 | Chip drag reorder with insertion line indicator | M | 4.1, 3.4 |
| 4.6 | Raw markdown toggle: serialize composer blocks to markdown and back | M | 4.1 |
| 4.7 | Skill preview: render markdown (lightweight renderer), metadata panel | M | — |
| 4.8 | Cron validation: inline cron expression check, required fields, disabled save | M | 3.2 |

#### v0.4b — Canvas Shell + Agent Cards (HIGH)
| # | Task | Effort | Depends on |
|---|---|---|---|
| 4.9 | Canvas view container with positioned divs + CSS transforms | M | 3.1 |
| 4.10 | Agent card component: emoji, name, role, skill pills | M | 4.9 |
| 4.11 | Skills palette sidebar (reuse SkillsDrawer data) | S | 4.9 |
| 4.12 | Drag skill from palette onto agent card → `POST /api/skill/copy` | M | 4.10, 4.11 |
| 4.13 | `POST /api/agents/create` endpoint (scaffold workspace dir) | M | — |
| 4.14 | Agent card click → switch to Files view + open agent files | S | 4.10 |
| 4.15 | Canvas positions persistence (localStorage → later config file) | S | 4.9 |

#### v0.5 — TipTap WYSIWYG Editor (MED-HIGH)
| # | Task | Effort | Depends on |
|---|---|---|---|
| 5.1 | Install TipTap + create `RichEditor.tsx` with starter kit | M | — |
| 5.2 | Markdown ↔ TipTap serialization (roundtrip fidelity) | L | 5.1 |
| 5.3 | Mode switch: WYSIWYG / Raw / Split-preview | M | 5.1, 5.2 |
| 5.4 | Pane routing: `.md` instruction files → RichEditor, others → CMEditor | S | 5.1 |
| 5.5 | TipTap styling: design system tokens (paper/coral/ink) | M | 5.1 |
| 5.6 | Dirty/save flow integration (same as CMEditor) | S | 5.4 |
| 5.7 | Protected raw blocks for unsupported markdown syntax | M | 5.2 |
| 5.8 | One-time tooltip onboarding for mode switch | S | 5.3 |

#### v0.6 — Canvas Links + Inspector (STRETCH)
| # | Task | Effort | Depends on |
|---|---|---|---|
| 6.1 | Link semantics: "uses", "feeds", "scheduled by" between nodes | L | 4.9 |
| 6.2 | Node side-panel inspector (open file, use in cron, quick actions) | M | 4.10 |
| 6.3 | Auto-detect edges from cron targets + shared skills | M | 6.1 |
| 6.4 | Canvas save/load (persist graph to JSON config) | M | 4.15 |

**Effort key:** S = < half day, M = 1-2 days, L = 3-5 days

---

## 2. UX Critique of Current Implementation

### 2.1 Prompt Composer — biggest gap
**Problem:** The current composer is a plain `<textarea>` that detects skills via regex (`/\[skill:\s*([^\]]+)\]/gi`). This creates several issues:

1. **No visual distinction between content types.** A skill reference looks like typed text. Users can accidentally edit the `[skill: ...]` tag syntax and break detection.
2. **No chip affordances.** The "Detected skills" chips below the textarea are read-only indicators, not interactive blocks. You can't click a chip to inspect the skill, drag to reorder, or use keyboard navigation between chips.
3. **Serialization is fragile.** `removeSkillAt` does string slicing — one off-by-one bug and the prompt corrupts.
4. **Single autocomplete type.** Only `/skill` works. The design spec calls for `/file`, `/var`, `/section`, and `@`-mentions.

**Recommendation:** Replace with a proper block-model editor. Two viable approaches:
- **A) TipTap-based composer** — reuse the same editor planned for v0.5 with custom node types for chips. Pros: one editor framework. Cons: heavier dependency for what's essentially a structured textarea.
- **B) Custom block model** — a lightweight `ComposerBlock[]` array rendered as a contenteditable div with inline chip spans. Pros: minimal deps, full control. Cons: contenteditable edge cases.

**Recommended: Option B for the composer, TipTap for Files.** The composer is a constrained environment (ordered blocks, no nesting) — a custom block model is simpler and avoids coupling composer bugs to the file editor. TipTap is right for free-form document editing in Files.

### 2.2 Skills Drawer — functional but missing polish
**What works:** Search, category filter, drag-to-insert, preview loading.

**Issues:**
1. **Preview is raw `<pre>` text** — should render markdown. Users can't quickly scan a skill's purpose.
2. **No metadata panel** — source path, which agents use it, author info from frontmatter.
3. **Preview fetches on every click** — no caching. Rapid clicking causes waterfall requests.
4. **Insert confirmation is missing** — design spec says "show toast + chip focus state after insert." Currently insert has no feedback beyond the text appearing.

### 2.3 Layout persistence — incomplete
**Crons:** `useResizablePane` correctly persists to localStorage with keys like `agentHub.crons.listWidth`. Good.

**Files panes:** The `PaneManager` divider handler sets `flex: 0 0 ${pct}%` directly on DOM elements — these values are **not persisted**. On reload, panes reset to equal widths.

**Fix:** Store pane width ratios in `panes.ts` Zustand store with localStorage middleware, or in a separate `layoutStore`.

### 2.4 View switching — no deep linking
`activeView` is React state (`useState`). If the user refreshes on the Crons tab, they're sent back to Files. There's no URL routing.

**Fix:** Use `window.location.hash` or a minimal router. Hash-based (`#/files`, `#/crons`, `#/canvas`) is sufficient for a single-page tool and doesn't require React Router as a dependency.

### 2.5 CronsPanel state ownership — fragile
All cron jobs state lives in `CronsPanel` local state (`useState`). This means:
- The TopBar can't show "3 active crons" badge
- The Canvas can't reference cron data
- Any future chat assistant can't access jobs without prop drilling

**Fix:** Extract to `store/crons.ts` Zustand store.

### 2.6 Interaction contract enforcement
The design doc defines clear rules (single click = select, double click = open, drag = move/compose, never implicit destructive). Currently:
- Skill click in drawer → selects (correct per spec)
- Skill `+` button → inserts (correct per spec)
- File click in sidebar → replaces active pane (matches spec)
- Drag file to pane body → replaces pane (matches spec)
- Drag file to pane divider → creates new pane at insertion point (matches spec)

**Missing:** No visual drop preview (ghost + label). No Escape to cancel pending drags. No double-click behavior defined for sidebar files.

---

## 3. Component List + State Model Changes

### 3.1 New Components

```
client/src/components/
├── Canvas/
│   ├── CanvasView.tsx           # Container: positioned canvas + sidebar palette
│   ├── AgentCard.tsx            # Draggable agent node (emoji, name, role, skills)
│   ├── SkillPalette.tsx         # Right-side skill picker for canvas
│   ├── CanvasLink.tsx           # SVG edge between nodes
│   └── NodeInspector.tsx        # Side panel for selected node details
│
├── Composer/
│   ├── BlockComposer.tsx        # Main chip-based composer (replaces PromptComposer)
│   ├── ComposerChip.tsx         # Inline chip: skill/file/var with type icon + ×
│   ├── ChipInspector.tsx        # Popover inspector for selected chip
│   ├── AutocompleteMenu.tsx     # Shared autocomplete dropdown (/skill, /file, /var, @)
│   └── RawToggle.tsx            # Raw markdown ↔ block view toggle
│
├── Editor/
│   ├── RichEditor.tsx           # TipTap WYSIWYG editor (v0.5)
│   ├── EditorModeSwitch.tsx     # WYSIWYG / Raw / Split toggle
│   └── (existing: CMEditor.tsx, Pane.tsx, PaneManager.tsx)
│
├── Shared/
│   ├── DropPreview.tsx          # Ghost + label shown during drag
│   ├── OnboardingTooltip.tsx    # First-use hint (dismissible, persisted)
│   └── MarkdownPreview.tsx      # Lightweight md renderer (skill preview + composer raw tab)
│
└── Crons/
    └── (existing: CronsPanel.tsx, CronDetail.tsx, SkillsDrawer.tsx — modified)
```

### 3.2 New Zustand Stores

#### `store/crons.ts` — extracted from CronsPanel local state
```typescript
interface CronsStore {
  jobs: CronJob[]
  loading: boolean
  openJobIds: string[]
  activeJobId: string | null

  // Actions
  loadJobs: () => Promise<void>
  createJob: () => Promise<void>
  updateJob: (id: string, patch: Partial<CronJob>) => Promise<void>
  deleteJob: (id: string) => Promise<void>
  toggleJob: (id: string) => Promise<void>
  openJob: (id: string) => void
  closeJob: (id: string) => void
  setActiveJob: (id: string) => void
}
```

#### `store/canvas.ts` — new
```typescript
interface CanvasNode {
  id: string               // agent ID or skill library ID
  kind: 'agent' | 'skill-library' | 'context'
  x: number
  y: number
  width: number
  height: number
}

interface CanvasEdge {
  id: string
  from: string
  to: string
  label: 'uses' | 'feeds' | 'scheduled-by'
}

interface CanvasStore {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedNodeId: string | null
  zoom: number
  pan: { x: number; y: number }

  // Actions
  addNode: (node: Omit<CanvasNode, 'id'>) => string
  moveNode: (id: string, x: number, y: number) => void
  removeNode: (id: string) => void
  selectNode: (id: string | null) => void
  addEdge: (from: string, to: string, label: CanvasEdge['label']) => void
  removeEdge: (id: string) => void
  saveLayout: () => void    // persist to localStorage
  loadLayout: () => void    // hydrate from localStorage
}
```

#### `store/layout.ts` — new (replaces ad-hoc localStorage)
```typescript
interface LayoutStore {
  activeView: 'files' | 'crons' | 'canvas'
  paneWidthRatios: number[]       // Files pane relative widths
  cronsListWidth: number
  cronsSkillsWidth: number
  cronsSkillsOpen: boolean
  sidebarCollapsed: boolean

  setActiveView: (v: LayoutStore['activeView']) => void
  setPaneWidthRatios: (ratios: number[]) => void
  // ... setters with localStorage persist
}
```

### 3.3 Composer Block Model (core data structure)

```typescript
// types/composer.ts
type ComposerBlockKind = 'text' | 'skill' | 'file' | 'variable'

interface ComposerBlock {
  id: string                      // nanoid or counter
  kind: ComposerBlockKind
  // For text blocks
  text?: string
  // For chip blocks
  ref?: string                    // skill name, file path, or variable key
  meta?: Record<string, string>   // source path, version, default value, etc.
}

// Serialization
function serializeToMarkdown(blocks: ComposerBlock[]): string
function parseFromMarkdown(md: string): ComposerBlock[]
```

### 3.4 Modified Existing Components

| Component | Changes |
|---|---|
| `App.tsx` | Replace `activeView` useState with `layoutStore.activeView`; add Canvas route; use hash-based routing |
| `TopBar.tsx` | Add Canvas tab; read activeView from layoutStore; show active crons count badge |
| `CronsPanel.tsx` | Consume `cronsStore` instead of local state; pass store actions to children |
| `PromptComposer.tsx` | **Replace entirely** with `BlockComposer.tsx` |
| `SkillsDrawer.tsx` | Add `MarkdownPreview` for preview body; add metadata section; cache preview content |
| `PaneManager.tsx` | Persist width ratios to `layoutStore` on divider drag end |
| `Pane.tsx` | Route `.md` instruction files to `RichEditor` (v0.5), fallback to `CMEditor` |

### 3.5 New Dependencies

| Package | Version | Purpose | Phase |
|---|---|---|---|
| `@tiptap/react` | ^2.x | WYSIWYG editor framework | v0.5 |
| `@tiptap/starter-kit` | ^2.x | Headings, lists, bold/italic/code | v0.5 |
| `@tiptap/extension-placeholder` | ^2.x | Empty editor placeholder text | v0.5 |
| `tiptap-markdown` | ^0.8.x | Markdown ↔ TipTap serialization | v0.5 |
| `nanoid` | ^5.x | Unique IDs for composer blocks + canvas nodes | v0.4 |

No heavy canvas libraries needed — v0.4b Canvas uses positioned `<div>`s with CSS transforms. SVG `<line>` or `<path>` elements for edges. If the MVP proves the concept, a library like `@xyflow/react` can be evaluated for v0.6+.

---

## 4. Risk Mitigation

### Risk 1: TipTap markdown roundtrip fidelity
**Threat:** Saving a TipTap-edited file loses formatting, comments, or custom syntax that agents depend on (frontmatter, `{{variables}}`, `[skill: ...]` tags).

**Mitigations:**
- Use `tiptap-markdown` which preserves raw blocks for unrecognized syntax.
- Build a roundtrip test suite: take 20 representative files from real agent workspaces, serialize through TipTap, diff against originals. Zero-diff for supported syntax, preserved-as-raw for unsupported.
- Keep CodeMirror raw mode always one click away — never force WYSIWYG.
- Default new installs to WYSIWYG; existing users keep raw until they opt in.

### Risk 2: Composer complexity overwhelming users
**Threat:** Chip model + autocomplete + raw toggle + drag reorder adds many interaction surfaces. Users who just want to type a prompt get confused.

**Mitigations:**
- Progressive disclosure: composer starts as a plain textarea look. Chips only appear when a `/skill`, `/file`, or `@` command is triggered or a skill is dragged in.
- Text-first: users can always type plain text. The raw markdown tab always works.
- Inline help: placeholder text shows `/skill to add a skill, @ to mention`.
- Backward compatible: existing `[skill: name]` text in saved jobs renders as chips on load, round-trips back to the same text on save.

### Risk 3: Canvas becoming novelty without utility
**Threat:** Pretty agent cards on a canvas that users look at once then ignore.

**Mitigations:**
- Every node has concrete actions: click → open files, right-click → use in cron, drag skill → install.
- Canvas is the only place to create new agents (v0.4b) — users must visit it.
- Auto-populate canvas from `/api/tree` data — zero setup friction.
- Defer edge lines and link semantics to v0.6 — don't invest in visualization until cards prove useful.

### Risk 4: CronsPanel state extraction breaking existing behavior
**Threat:** Moving state from local `useState` to Zustand store introduces subtle re-render or stale-data bugs.

**Mitigations:**
- Extract store first, keep CronsPanel as sole consumer. Verify identical behavior.
- Only then wire additional consumers (TopBar badge, Canvas cron edges).
- Zustand's shallow equality prevents unnecessary re-renders by default.

### Risk 5: Scope creep on chip-based composer
**Threat:** Building a mini rich-text editor from scratch (contenteditable + chips) devolves into months of browser-compat work.

**Mitigations:**
- Use a proven pattern: a `<div contentEditable>` with inline `<span>` chips rendered via React portals, inspired by Slack/Linear message composers.
- Alternatively, use TipTap with custom `Mention`-style nodes — if we're already adding TipTap for v0.5, this avoids two editor frameworks.
- **Decision point:** If the custom approach takes more than 3 days of the 7-day sprint, pivot to TipTap-based composer and collapse the v0.4a/v0.5 work.

### Risk 6: Performance with large skill libraries
**Threat:** `/api/tree` returns all agents and skills in one payload. As libraries grow (50+ skills × 10 agents), the SkillsDrawer and autocomplete menus slow down.

**Mitigations:**
- Virtualize skill lists (only render visible rows) using CSS `content-visibility: auto` or a lightweight virtual list.
- Cache `/api/tree` response in a `treeStore` with SWR-style revalidation.
- Autocomplete limits results to 12 items (already in place).

---

## 5. Seven-Day Execution Plan

> Assumes one senior engineer working full days. Adjust for team size.

### Day 1 — Foundation: Stores + Routing + Persistence

**Morning:**
- [ ] Create `store/crons.ts` — extract all CronsPanel state + async actions
- [ ] Refactor `CronsPanel.tsx` to consume `cronsStore` — verify identical behavior
- [ ] Create `store/layout.ts` — activeView, panel widths, localStorage persist middleware

**Afternoon:**
- [ ] Hash-based routing in `App.tsx`: `#/files`, `#/crons`, `#/canvas` synced with `layoutStore.activeView`
- [ ] Add Canvas tab to `TopBar.tsx` (routes to empty `<CanvasPlaceholder />`)
- [ ] Persist Files pane width ratios: update `PaneManager.tsx` divider handler to write to `layoutStore`
- [ ] Verify: reload preserves active view + panel widths in both Files and Crons

**Deliverable:** Foundation stores, hash routing, layout persistence. All existing behavior preserved.

---

### Day 2 — Composer Block Model + Basic Chips

**Morning:**
- [ ] Define `types/composer.ts`: `ComposerBlock`, `serializeToMarkdown()`, `parseFromMarkdown()`
- [ ] Build `BlockComposer.tsx` shell: renders `ComposerBlock[]` as text spans + chip spans inside a wrapper div
- [ ] Implement text input handling: typing creates/extends text blocks, Enter adds newline within text block

**Afternoon:**
- [ ] Build `ComposerChip.tsx`: renders skill/file/var chip with type badge + `×` remove
- [ ] Wire `/skill` autocomplete: reuse existing logic from `PromptComposer`, trigger `AutocompleteMenu.tsx` dropdown
- [ ] On autocomplete select: insert `ComposerBlock { kind: 'skill', ref: name }` at cursor position
- [ ] Backward compat: `parseFromMarkdown` detects existing `[skill: name]` syntax and creates chip blocks

**Deliverable:** Working chip-based composer replacing the textarea. Skills insert as chips. Existing job prompts load correctly.

---

### Day 3 — Composer Polish + Validation

**Morning:**
- [ ] Add `/file` autocomplete (searches tree files) and `@` mention (searches agents + files)
- [ ] Chip click → inline `ChipInspector.tsx` popover (skill: shows source path + preview link; file: shows path; var: shows default)
- [ ] Chip drag reorder with insertion line indicator (reuse drag/drop patterns from PaneManager)

**Afternoon:**
- [ ] Raw markdown toggle: `RawToggle.tsx` button switches between composer block view and plain textarea
- [ ] Switching to raw → `serializeToMarkdown(blocks)`; switching back → `parseFromMarkdown(text)` with best-effort preservation
- [ ] Cron validation in `CronDetail.tsx`: inline cron expression validator, required fields check, disable Save button until valid
- [ ] Toast feedback on skill insert ("Skill 'x' added") per design spec

**Deliverable:** Full composer with all autocomplete types, chip interactions, raw toggle, validation.

---

### Day 4 — Skills Drawer Upgrade + Interaction Polish

**Morning:**
- [ ] `MarkdownPreview.tsx`: lightweight markdown-to-HTML renderer (use a small lib like `marked` or hand-roll for headings/lists/bold/code)
- [ ] Replace `<pre>` in `SkillsDrawer.tsx` preview with `MarkdownPreview`
- [ ] Add metadata section to preview: source path, which agents use it, file size

**Afternoon:**
- [ ] `DropPreview.tsx`: ghost element + label shown during any drag (file → pane, skill → composer, skill → canvas agent card)
- [ ] `OnboardingTooltip.tsx`: dismissible hint component, shown once per feature, state in localStorage
- [ ] Add tooltips: "Drag to pane divider to split" (Files), "Type /skill to search" (Composer), "Click to preview, + to insert" (Skills)
- [ ] Double-click file in sidebar → opens in new pane (instead of replacing active)

**Deliverable:** Polished skills preview, drag feedback, onboarding hints. v0.3 acceptance criteria met.

---

### Day 5 — Canvas MVP: Agent Cards

**Morning:**
- [ ] `store/canvas.ts`: nodes, edges, selection, zoom/pan, localStorage persistence
- [ ] `CanvasView.tsx`: container with pannable/zoomable surface (CSS transform on wrapper div), auto-populate nodes from `/api/tree` agents
- [ ] `AgentCard.tsx`: positioned div with emoji, name, role, skill pills list

**Afternoon:**
- [ ] Card dragging: mousedown/mousemove/mouseup on card → update node position in store
- [ ] `SkillPalette.tsx`: right-side panel listing all skills, drag from palette → drop on agent card → `POST /api/skill/copy`
- [ ] Agent card click → `layoutStore.setActiveView('files')` + open agent's first instruction file
- [ ] Canvas positions auto-save to localStorage on change

**Deliverable:** Working Canvas view with draggable agent cards, skill assignment via drag, navigation to Files.

---

### Day 6 — TipTap WYSIWYG Editor

**Morning:**
- [ ] Install TipTap deps: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `tiptap-markdown`
- [ ] `RichEditor.tsx`: TipTap editor with starter kit (headings, lists, bold/italic/code/links, blockquotes)
- [ ] Markdown serialization: load `.md` content → TipTap; save TipTap → `.md`
- [ ] `EditorModeSwitch.tsx`: toggle WYSIWYG / Raw (CodeMirror)

**Afternoon:**
- [ ] TipTap styling in `index.css`: design system tokens for `.ProseMirror` elements (headings, code, blockquotes use paper/coral/ink)
- [ ] `Pane.tsx` routing: instruction files (`AGENTS.md`, `MISSION.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`) default to `RichEditor`; all others default to `CMEditor`; mode switch overrides
- [ ] Dirty/save flow: TipTap `onUpdate` → `paneStore.updateContent()`; same Ctrl+S handler
- [ ] Protected raw blocks: unsupported markdown renders as monospace code fence in TipTap

**Deliverable:** WYSIWYG editing for instruction files with mode switch and roundtrip fidelity.

---

### Day 7 — Integration Testing + Polish + Stretch Goals

**Morning:**
- [ ] End-to-end smoke tests (manual): create cron → compose with chips → save → reload → verify chips render
- [ ] Roundtrip test: open 10 real agent files in TipTap, save, diff against originals
- [ ] Fix any regressions from store extraction (crons behavior, layout persistence)
- [ ] Verify Canvas: add agent card, drag skill, navigate back to Files

**Afternoon:**
- [ ] Stretch: `POST /api/agents/create` endpoint — scaffold `workspace-{id}/` with `IDENTITY.md` + `SOUL.md` + `AGENTS.md`
- [ ] Stretch: "New Agent" button in Canvas → calls create endpoint → adds card
- [ ] Stretch: Canvas SVG edges between agents that share skills (auto-detected from tree data)
- [ ] Final CSS polish: verify all new components use design system tokens, spacing scale, shadow hierarchy
- [ ] Update `activeView` type to `'files' | 'crons' | 'canvas'` across all TypeScript interfaces

**Deliverable:** Stable v0.3-v0.5 feature set. Canvas MVP functional. Ready for user testing.

---

## Appendix A: Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Composer approach | Custom block model (not TipTap) | Composer is constrained (flat block list); simpler than full ProseMirror. Fallback: pivot to TipTap if > 3 days. |
| Canvas library | Plain positioned divs + CSS transforms | MVP doesn't need panning/zooming/minimap. Add `@xyflow/react` in v0.6 if needed. |
| Routing | Hash-based (`window.location.hash`) | No React Router dependency. SPA tool doesn't need SEO or nested routes. |
| Markdown renderer (skill preview) | Lightweight lib (`marked` or `snarkdown`) | TipTap is overkill for read-only preview. Keep it separate and small. |
| State persistence | Zustand `persist` middleware + localStorage | Already using Zustand. No additional deps needed. Built-in `partialize` for selective persist. |
| New agent creation | Backend scaffold endpoint | Canvas "New Agent" needs atomic file creation. Can't do mkdir + write from client. |

## Appendix B: Files Changed Per Day

| Day | New files | Modified files |
|---|---|---|
| 1 | `store/crons.ts`, `store/layout.ts` | `App.tsx`, `TopBar.tsx`, `CronsPanel.tsx`, `PaneManager.tsx` |
| 2 | `types/composer.ts`, `Composer/BlockComposer.tsx`, `Composer/ComposerChip.tsx`, `Composer/AutocompleteMenu.tsx` | `CronDetail.tsx` (swap composer) |
| 3 | `Composer/ChipInspector.tsx`, `Composer/RawToggle.tsx` | `BlockComposer.tsx`, `CronDetail.tsx` (validation) |
| 4 | `Shared/MarkdownPreview.tsx`, `Shared/DropPreview.tsx`, `Shared/OnboardingTooltip.tsx` | `SkillsDrawer.tsx`, `FileItem.tsx`, `PaneManager.tsx` |
| 5 | `store/canvas.ts`, `Canvas/CanvasView.tsx`, `Canvas/AgentCard.tsx`, `Canvas/SkillPalette.tsx` | `App.tsx` (add canvas route) |
| 6 | `Editor/RichEditor.tsx`, `Editor/EditorModeSwitch.tsx` | `Pane.tsx`, `index.css`, `client/package.json` |
| 7 | (stretch: `Canvas/CanvasLink.tsx`) | Various polish + regression fixes |
