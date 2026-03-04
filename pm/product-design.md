# Agent Hub Product Design Document

## 1) Product Thesis
Agent Hub should feel like a stable, production-grade operating console for AI agents: users can reliably find files, compose runnable cron prompts from reusable skills/context blocks, and visually reason about agent workflows in a canvas without losing the precision of markdown files. The product direction is a hybrid of IDE rigor (predictable panes, explicit save/insert actions), Notion-like editing comfort (WYSIWYG markdown authoring), and composable workflow design (lego-style canvas objects), all within the existing warm paper/coral/ink Laniameda system.

## 2) User + JTBD
Primary users:
- Solo builders running OpenClaw/Codex/Claude setups locally or on VPS
- Small operator teams maintaining multiple agent workspaces and skill libraries

Jobs to be done:
- Edit and maintain instruction/context files fast, without markdown syntax overhead
- Build and schedule cron jobs by assembling skills, files, and prompt text
- Understand relationships between agents, skills, and context at a glance
- Safely copy/move/delete skills across libraries with clear intent and feedback

Key success metrics:
- Time to create first valid cron job
- Save success rate without accidental overwrite
- Frequency of skill insertion into prompt composer
- Reduced pane/layout “surprise” events (unexpected replace/new pane behavior)
- Weekly active editing sessions per workspace

## 3) IA / Navigation Model
Top-level product areas:
- Files
- Crons
- Canvas

Navigation structure:
- Persistent left rail: workspace tree (agents, instruction files, memory, PM files, skill libraries)
- Top app tabs: Files | Crons | Canvas
- Context-sensitive right rail in Crons and Canvas

Paradigm mapping:
- Files: IDE/document editor paradigm
- Crons: Prompt builder + scheduler paradigm
- Canvas: Spatial modeler paradigm (nodes/bricks + links)

Cross-area object model (shared IDs and labels):
- Agent
- File (markdown-backed)
- Skill (folder with `SKILL.md`)
- Context block (selected file excerpt, note, or skill output)
- Cron job (schedule + prompt payload + target agent)

Transition rules:
- Opening a file from any area routes to Files area and focuses existing/opened pane
- “Use in Cron” from file/skill opens Crons with object pre-attached as a chip
- “Open in Canvas” from agent/skill creates or focuses corresponding canvas node

## 4) Core Interaction Rules
Global interaction contract (must be consistent across Files, Crons, Canvas):
- Single click: select/focus
- Double click: open primary editor/detail
- Drag: move/compose/reorder only (never implicit destructive change)
- Drop target must preview result before commit (ghost + label)
- Enter/primary button commits action; Escape cancels pending action

Pane rules (Files):
- Click file in tree: replace active pane content
- Drag file to pane body: replace that pane
- Drag file to pane tab/header: create new pane to the right (max panes configured)
- Explicit “+ Pane” creates empty pane only
- Active pane always visually distinct with persistent underline/accent

Skill rules:
- Skill click: open preview only (never auto-insert into prompt)
- Skill insertion requires explicit action: `Insert` button or drag into composer
- Skill drag from rail to composer creates a skill chip with immutable source metadata

Composition rules:
- Chips are atomic blocks (skill, file, variable, free-text block)
- Backspace on empty cursor removes previous chip (with undo)
- Reordering chips is drag-and-drop only, with insertion line indicator
- Removing chip requires explicit `x` or keyboard delete on focused chip

## 5) Detailed UX Specs

### 5.1 Crons Layout + Resizable Rules
Target layout (desktop >=1200px):
- Left: Jobs list panel (280px default, resizable 240-420)
- Center: Prompt Composer (fluid, min 520)
- Right: Skills/Context rail (360px default, resizable 280-520)

Tablet (768-1199px):
- Left jobs list collapses to icon+label drawer
- Right rail overlays as slide panel
- Composer remains primary surface

Mobile (<768px):
- Single-column stack
- Bottom sheet for skill/context insertion
- Job list accessible via top switcher

Resizable behavior:
- Visible drag handles at panel boundaries
- Handle hover/active state uses coral accent and thicker hit zone
- Double-click handle resets adjacent panels to defaults
- Widths persist per user/session in local storage

Jobs list interactions:
- Shows name, schedule, target agent, status badge, last run time
- Single select opens job in composer; unsaved changes prompt on switch
- `New Job` starts blank template with required fields scaffold

Job editor sections:
- Header: name, enabled toggle, schedule expression, timezone
- Composer: chip-based prompt + raw markdown toggle
- Execution settings: target agent, optional skill context mode, retries
- Footer: Validate, Save, Run Now (if backend later supports trigger)

Validation:
- Inline cron expression validity
- Required fields: name, schedule, target, non-empty prompt
- Save disabled until validation passes

### 5.2 Skills Rail + Preview/Insert Rules
Rail location:
- Pinned on right by default in Crons
- Collapsible to icon strip
- Resizable with persistent width

Rail sections:
- Search
- Source filters: All, Studio, Community, OpenClaw
- Skill list grouped by source/library

Skill row:
- Name, source badge, short description (from frontmatter/first line)
- Hover actions: Preview, Insert
- Context menu: Open file, Copy to agent, Move, Delete (existing APIs)

Preview behavior:
- Opens side preview panel with `SKILL.md` rendered and raw toggle
- Includes metadata (name, author, source path)
- Keyboard: `Enter` on selected row opens preview, not insert

Insert behavior:
- `Insert` adds skill chip at caret in composer
- Drag skill row into composer inserts at drop index
- After insert, show toast confirmation and chip focus state

### 5.3 Prompt Composer Rules
Composer model:
- Ordered sequence of blocks:
  - Text block
  - Skill chip
  - File chip
  - Variable chip (`{{var}}`)

Input methods:
- Typing creates/edits text block
- `/` command menu for quick insertion (`/skill`, `/file`, `/var`, `/section`)
- `@` mentions agents/files for direct chip insertion

Autocomplete:
- `/skill` opens searchable skills list with keyboard nav
- Selecting result inserts skill chip and keeps caret after chip
- Recent items rank higher than alphabetical default

Chip behavior:
- Chip click selects chip and opens inline inspector
- Inspector fields differ by chip type (e.g., skill version/source, file path, var default)
- Drag reorder with clear insertion marker
- Multi-select chips with shift-click for batch delete/reorder (desktop)

Output serialization:
- Composer always serializes deterministically to markdown/plain prompt text
- Human-readable preview tab shows final merged prompt
- “Raw” tab editable for advanced users; switching back preserves block mapping when possible

### 5.4 Files Editor: Markdown WYSIWYG Plan
Goal:
- Replace “raw markdown only” default with Notion-style editable render while preserving markdown as source of truth

Editor modes:
- WYSIWYG mode (default for instruction/context files)
- Raw markdown mode (power users)
- Split preview mode optional in phase 2

WYSIWYG capabilities (v1):
- Heading levels, paragraph, bullet/numbered lists, task list
- Bold/italic/code/link
- Callout/admonition block style for key instruction sections
- Drag reorder block handles
- Slash menu for block insertion

Markdown fidelity rules:
- No lossy conversion for supported syntax
- Unsupported markdown retained as protected raw block
- Roundtrip guarantee for common structures used in AGENTS/SOUL/MISSION files

File safety:
- Dirty indicator per pane/file
- Autosave optional setting (off by default initially)
- Save conflict warning if file changed on disk since load

Migration plan:
- Start with instruction file types (`AGENTS.md`, `MISSION.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`)
- Keep CodeMirror raw editor as fallback
- Add one-time tooltip onboarding for mode switch

## 6) Design System Application Notes
Visual direction:
- Maintain warm paper/coral/ink identity and brutalist depth tokens
- No green-forward UI accents as primary actions

Token usage:
- Primary action: `--coral`
- Emphasis text/icons: `--ink`
- Background hierarchy: `--p`, `--s1`, `--s2`
- Borders/shadows: existing `--bd`, `--sh-b`, `--sh-md`

Spacing and rhythm:
- 4/8/12/16/24 scale only
- Dense data regions (job list, skill rows): 8-12 vertical rhythm
- Editing surfaces and inspectors: 16-24 spacing

Interactive states:
- Hover: subtle lift + shadow increase
- Focus: clear outline and coral inset or border accent
- Active: persistent selected background and label contrast
- Disabled: lower contrast and no hover transform

Typography:
- Inter for UI and body text
- JetBrains Mono for paths, tokens, chips, schedule syntax, badges

## 7) Incremental Rollout Plan (v0.3-v0.6)

### v0.3 (Foundation: Stability + Interaction Contract)
Scope:
- Introduce top-level tabs: Files/Crons/Canvas shell
- Standardize click/drag/drop rules in Files
- Add persistent, explicit resizable handles and width persistence
- Implement right skills rail pinned/collapsible/resizable in Crons shell

Acceptance:
- No ambiguous drop outcomes
- Pane behaviors documented in-product via tooltips/help
- Layout persists across reload

### v0.4 (Crons Builder MVP)
Scope:
- Full jobs list + job editor backed by `/api/crons` CRUD
- Chip-based composer with text + skill + file chips
- `/skill` autocomplete and explicit insert action
- Skill preview drawer with metadata + rendered markdown

Acceptance:
- User can create, edit, validate, and save cron jobs end-to-end
- Skill click never mutates prompt unless explicit insert

### v0.5 (WYSIWYG Files Editor)
Scope:
- WYSIWYG markdown editor for instruction/context files
- Raw mode fallback and mode switch
- Deterministic serialization and dirty/save rules

Acceptance:
- Roundtrip for standard markdown structures
- Existing files render correctly without format corruption

### v0.6 (Canvas Vision MVP)
Scope:
- Canvas area with draggable bricks: agent, skill, context, cron
- Link semantics: “uses”, “feeds”, “scheduled by”
- Node side panel inspector and quick actions (open file, use in cron)

Acceptance:
- User can build and save a visual map of workflow components
- Canvas objects deep-link to Files/Crons entities

## 8) Risks / Tradeoffs
Main risks:
- WYSIWYG markdown fidelity can introduce trust issues if roundtrip breaks edge syntax
- Composer complexity (chips + raw mode + autocomplete) can overwhelm if not progressively disclosed
- Canvas can become novelty unless tied to executable actions
- Legacy `index.html` and newer client architecture may diverge in behavior if not unified under shared interaction spec

Mitigations:
- Keep raw mode always available and one-click accessible
- Ship strict telemetry around conversion failures and rollback rate
- Prioritize actionability in Canvas (every node has concrete “open/insert/run” actions)
- Define a shared UI interaction contract doc and test checklist used across Files/Crons/Canvas

Non-goals for v0.3-v0.6:
- Multi-user real-time collaboration
- Full cron runtime observability dashboard
- Rich plugin ecosystem

---
Implementation note: this plan is intentionally client-forward and compatible with existing Express APIs (`/api/tree`, `/api/file`, `/api/skill/*`, `/api/crons`, `/api/assign-targets`) with only minimal backend additions required for future run-history/status features.
