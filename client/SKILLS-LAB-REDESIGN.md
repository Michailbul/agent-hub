# Skills Lab — Complete Architecture & Redesign Brief

## Current State: What We Have

### Overview
The Skills Lab is a 4-panel IDE-like interface for managing AI skills (markdown instruction files) across multiple source libraries and agents. It lets you browse, search, filter, preview, edit, star, install, and deploy skills.

---

## 1. Layout Architecture

### Panel System
The entire UI lives inside a single root container (`kl-canvas`) that fills the viewport. Inside is a horizontal flex row (`kl-panels`) containing 4 panels:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ kl-canvas (position: absolute, inset: 0)                                       │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ kl-panels (display: flex, position: absolute, inset: 0)                    │ │
│ │ ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐ ┌────────────┐ │ │
│ │ │          │▐│              │▐│                            │ │            │ │ │
│ │ │   NAV    │▐│   RESULTS    │▐│      EDITOR / PREVIEW     │ │  INSPECTOR │ │ │
│ │ │          │▐│              │▐│                            │ │            │ │ │
│ │ │ 280px    │▐│  340px       │▐│   flex: 1 (fills rest)    │ │  auto      │ │ │
│ │ │ ±resize  │▐│  ±resize     │▐│                            │ │  ~320px    │ │ │
│ │ └──────────┘ └──────────────┘ └──────────────────────────┘ └────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ StatusBar (fixed height, bottom)                                           │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**▐ = resizable drag handle (14px wide, mouse-drag, localStorage-persisted)**

### Resizable Panels (via `useResizable` hook)
| Panel | Initial | Min | Max | localStorage Key |
|-------|---------|-----|-----|-----------------|
| Nav | 280px | 220px | 420px | `kl-nav-w` |
| Results | 340px | 260px | 560px | `kl-results-w` |
| File Tree (inside Editor) | 200px | 140px | 360px | `kl-filetree-w` |

The **Editor panel** uses `flex: 1` (fills remaining space). The **Inspector panel** has a fixed width (~320px in CSS). Only the Nav, Results, and File Tree sub-panel are user-resizable.

### Conditional Panels
- **Editor + Inspector** only appear when a skill is selected (`expandedSkillId !== null`)
- When no skill is selected, the Results panel expands to fill the full remaining width
- The Editor panel itself splits into a **File Tree sidebar** (resizable) and the **CodeMirror editor pane**

### Focus Dimming
One panel can be "focused" at a time via `onMouseDown`. When a panel is focused:
- It gets `kl-focused` class (full opacity)
- All other panels get `kl-dimmed` class (reduced opacity ~0.7)
- Clicking outside or on another panel shifts focus

---

## 2. Panel-by-Panel Breakdown

### Panel A: Navigator (Left Sidebar)

**Header**: "Skills" title + total skill count badge

**Search Bar**:
- Search icon + text input + clear button
- Filters skills by full-text index (name, description, author, source, license, agents, variants)
- Debounced, instant feedback

**Scope Switch** (2-column grid of pill buttons):
- "All Libraries" — shows everything
- "Claude Code" — filters to skills with Claude variant only
- Below that: "Starred (N)" / "Recent" saved view pills

**Navigation Tree** (scrollable):
- **Departments section**: Buttons with department name + count, multi-select toggle
- **Sources section**: Buttons with color dot + source name + count, single-select toggle
- **FacetedFilters component** (only when scope != 'claude'):
  - Collapsible sections for Source, Agent, Family
  - Each section shows items with counts
  - "Special" section with toggles for "Design skills" and "Duplicates only"

**Nav Status Footer**:
- "{filtered}/{total}" count display
- "Clear" button when filters are active

### Panel B: Results (Skills List)

**Header**:
- Panel title (changes based on active filters: department name or "Skills" or "Claude Code")
- View toggle buttons: List | Grid
- Density buttons (only in list mode): S | M | L (compact/comfortable/spacious)
- Results count badge
- "Install" button (opens install modal)

**Active Filters Bar** (conditional):
- Horizontal row of removable chips for each active filter
- "Clear all" button at end

**Results Body** (scrollable):
- **List view**: Skills grouped by family
  - Family header with label + count
  - Each skill is a `<button>` row showing: name, source/version meta, star toggle
  - Active skill highlighted
  - Duplicate skills marked
- **Grid view**: CSS grid of cards
  - Each card shows: name, department, family, star toggle
  - Active card highlighted
- **Empty state**: "No skills match" with clear filter suggestions
- **Duplicate summary** (conditional): Shows count + "Remove duplicates" bulk action button

### Panel C: Editor/Preview (Main Content Area)

**Header**:
- Back button (closes editor, clears selection)
- Filename + source label
- Copy path button (disabled placeholder)
- Open externally button (disabled placeholder)

**Body** splits into:

```
┌────────────────┐┌──────────────────────────────────────────┐
│  File Tree     ││  CodeMirror Editor                       │
│  (resizable)   ││  (flex: 1)                               │
│                ││                                           │
│  200px ± drag  ││  - Markdown syntax highlighting           │
│                ││  - Line numbers, active line highlight     │
│  Shows:        ││  - Cmd+S to save (flash "Saved" for 1.5s)│
│  - Folder tree ││  - Unsaved dot indicator                  │
│  - File icons  ││  - Line wrapping                          │
│  - Click to    ││  - Bracket matching                       │
│    open file   ││  - History (undo/redo)                    │
└────────────────┘└──────────────────────────────────────────┘
```

**File Tree** (SkillFileTree component):
- Shows directory structure of the skill's root folder
- Lazy-loaded per skill via API
- Folders expand/collapse (state persisted in store)
- File icons by extension: ◊=md, {}=json, ◆=code, ◈=css, ≡=yaml, ◇=other
- Click file to load into editor

**CodeMirror Editor** (SkillCMEditor component):
- Read/write markdown editor
- Custom theme (brandTheme from cmBrandTheme)
- Status bar shows: unsaved dot, "Saved" flash, file path
- Saves via `saveFile()` API call

### Panel D: Inspector (Right Sidebar)

**Header**: "Details" title + star toggle button

**Skill Info Section**:
- Skill name (large text)
- Badge row: department badge, source badge, "Claude Code" badge (if applicable)
- Description paragraph
- Tags list: department, source, Claude, family labels

**Agents Section**:
- List of ALL agents in the system
- Each agent row shows: emoji, name, install/uninstall button
- Button shows loading state during toggle
- Can only install Claude variant

**Rollout Section** (only if Claude variant exists):
- "{installedCount}/{totalCount} active" summary
- Grid of agent chips — each is a toggle button
- Clicking installs/uninstalls for that agent

**Presence Section**:
- Row per source library showing: color dot, source label, presence kind
- Shows which sources have this skill

**Actions Section**:
- Deploy button
- Duplicate button
- Delete button (with preview/confirm flow)

### Overlays

**Command Palette** (Cmd+K):
- Modal with search input
- Shows first 20 skills when empty, max 30 on search
- Keyboard navigation: arrows up/down, Enter to select, Escape to close
- Searches by skill name, department, family

**Install Modal**:
- Backdrop overlay
- ZIP upload: button + drag-and-drop zone
- npx command input + "Run" button
- Shows: loading state, success/error notices, command output
- Escape to close

**Status Bar** (always visible, bottom of canvas):
- "{filtered}/{total} skills" with dot indicator
- Scope label ("Claude Code" or "All libraries")
- "Filtered" badge when filters active
- Cmd+K shortcut hint

---

## 3. State Management (Zustand Store)

### Store Shape
```
skillsLab store
├── Data (loaded from API)
│   ├── skills: UnifiedSkill[]
│   ├── sources: SkillSource[]
│   ├── agents: LabAgent[]
│   ├── departments: string[]
│   └── families: SkillFamily[]
│
├── API State
│   ├── loading, loaded, error
│
├── Filters (all toggle-style)
│   ├── searchQuery: string
│   ├── activeScope: 'all' | 'claude'
│   ├── activeSavedView: 'all' | 'starred' | 'recent'
│   ├── activeSourceFilter: string | null (single-select)
│   ├── activeAgentFilter: string | null (single-select)
│   ├── activeFamilyFilter: string | null (single-select)
│   ├── duplicateOnly: boolean
│   └── activeDepartments: Set<string> (multi-select)
│
├── Selection
│   ├── expandedSkillId: string | null
│   ├── activeSkillFile: string | null
│   └── selectedSkillIds: Set<string> (bulk selection)
│
├── File System Cache
│   ├── skillFileTreeCache: Record<string, SkillFile[]>
│   ├── expandedSkillFolders: Set<string>
│   └── skillContentCache: Record<string, string>
│
├── UI State
│   ├── starredSkillIds: Set<string>
│   ├── sortField: 'name' | 'department'
│   └── sortDir: 'asc' | 'desc'
│
└── Install State
    ├── installBusy, installError, installLastOutput
```

### Key Actions
- `loadFromAPI()` — fetches all skills/sources/agents, builds families/departments
- `loadSkillFileTree(rootPath)` — fetches directory listing for a skill
- `loadSkillContent(skillId, path)` — fetches file content, caches by `skillId:path`
- `assignSkill(agentId, variantPath)` / `unassignSkill(agentId, skillId)` — install/remove
- `toggleStarSkill(skillId)` — optimistic update with rollback
- `installFromZip(file)` / `installFromCommand(cmd)` — install new skills
- `previewDeleteSkill()` / `deleteSkill()` — delete with preview
- `previewRemoveDuplicates()` / `removeDuplicates()` — bulk duplicate cleanup
- `filtered()` — computed getter applying all active filters + sort

### Data Flow
```
API fetch → store.loadFromAPI()
  → maps raw data into: skills[], sources[], agents[], departments[], families[]
  → component reads via selectors
  → filteredSkills = store.filtered() (applies all filters)
  → UI renders filtered list

User clicks skill → store.setExpandedSkill(id)
  → triggers useEffect → loadSkillFileTree(root)
  → triggers useEffect → loadSkillContent(id, previewPath)
  → Editor + Inspector panels appear with data

User toggles filter → store.setActiveSourceFilter(id)
  → filteredSkills recomputes
  → Results panel re-renders
  → ActiveFiltersBar updates
```

---

## 4. Key Data Types

```typescript
interface UnifiedSkill {
  id: string                    // Unique identifier
  name: string                  // Raw name
  displayName: string           // Human-readable name
  department: string            // Category (e.g., "Development", "Design")
  familyKey: string | null      // Group key (prefix before first hyphen)
  familyLabel: string | null    // Human-readable family name
  canonicalSource: string       // Primary source library ID
  isDuplicate: boolean          // Exists in >1 library
  installedAgentIds: string[]   // Agents where this skill is installed
  previewPath: string | null    // Path to SKILL.md or main file
  presence: Record<string, PresenceKind>  // Per-source: 'native' | 'installed' | 'absent'
  sourceVariants: Record<string, SkillVariantRef>  // Per-source variant details
}

interface SkillVariantRef {
  sourceId: string
  sourceLabel: string
  kind: 'library' | 'community' | 'claude'
  path: string
  previewPath: string | null
  version: string | null
}

interface SkillSource {
  id: string
  label: string
  color: string      // Hex color for UI dot
  skillCount: number
}

interface LabAgent {
  id: string
  label: string
  emoji: string
  installedSkillIds: string[]
}

interface SkillFamily {
  key: string
  label: string
  count: number
}

interface SkillFile {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: SkillFile[]
}
```

---

## 5. What Feels Generic (Design Critique)

### The Problem
The current Skills Lab looks like a generic IDE/admin panel. It has the right functionality but the wrong personality. Every panel is a flat rectangle with a header and scrollable body. The visual language says "database admin tool" not "AI skills workspace."

### Specific Issues

**Layout feels like a spreadsheet**:
- 4 rigid columns with identical styling
- No visual hierarchy between panels
- Every panel competes for attention equally
- The resizer handles are functional but invisible — you wouldn't know they exist

**Results list is a wall of text**:
- Skill rows are just name + metadata text
- No visual preview, no personality
- Star button is tiny and hidden until hover
- Family grouping headers are barely visible
- Density controls (S/M/L) feel like checkbox UX

**Inspector is an afterthought**:
- Agents section is just a column of identical buttons
- Rollout grid is functional but ugly
- Presence section is a data table, not a visualization
- No visual connection between the selected skill and its details

**Editor area is raw**:
- File tree is a minimal indented list
- No visual context for what you're editing
- CodeMirror sits in a bare container
- No breadcrumb, no tab bar, no sense of place

**Install modal is a form**:
- Drag zone is just a dashed border
- Command input is a plain text field
- No visual feedback during installation (just a spinner)

**Everything uses the same visual weight**:
- Headers, labels, counts, badges — all feel the same
- No contrast between navigation chrome and content
- Status bar is an afterthought

---

## 6. Redesign Direction: What It Should Feel Like

### Design Philosophy
The Skills Lab should feel like **a conversation with your skill library** — not an admin dashboard. Think:
- **Chat UI patterns** for browsing and discovery (skills as message bubbles, not table rows)
- **Card-based exploration** with rich previews (like an app store, not a file manager)
- **Contextual sidebars** that slide in/out (like Slack threads, not Excel columns)
- **Personality in every surface** — warm, editorial, alive

### Reference Touchstones
- **Raycast** — command palette as primary navigation, clean keyboard-first UX
- **Linear** — sidebar navigation, issue detail as slide-over
- **Notion** — block-based content, emoji-rich, warm and inviting
- **Arc Browser** — sidebar with spaces, contextual panels, personality
- **Apple Music** — browsing grid, album detail view, warm gradients

### What We Keep (Functionality)
Every feature listed above stays. The Zustand store is untouched. The API layer is untouched. We're reskinning the **presentation layer only**.

### What Changes (Presentation)
- The rigid 4-column layout becomes a more fluid 2-3 panel layout
- Skill browsing becomes card/chat-bubble based with rich previews
- The inspector becomes a slide-over panel with personality
- The editor keeps CodeMirror but gets context (tabs, breadcrumbs, file icons)
- Filters become more discoverable and visually interesting
- Install flow becomes more guided and visual
- The whole thing gets the Agent Hub Web warm editorial treatment

---

## 7. Component Inventory (What to Recreate)

### Must-Have Components
| Component | Current | Lines | Complexity |
|-----------|---------|-------|------------|
| Main shell | V11KilnLight.tsx | ~1300 | High — all logic lives here |
| Zustand store | skillsLab.ts | ~500 | High — all state + API calls |
| CodeMirror editor | SkillCMEditor.tsx | ~100 | Medium — CM setup + save |
| File tree | SkillFileTree.tsx | ~100 | Medium — recursive tree |
| Faceted filters | FacetedFilters.tsx | ~80 | Low — collapsible sections |
| Active filter chips | ActiveFiltersBar.tsx | ~30 | Low — chip list |
| Command palette | CommandPalette.tsx | ~80 | Medium — search + keyboard |
| Card grid view | SkillCardView.tsx | ~40 | Low — grid of cards |
| Status bar | StatusBar.tsx | ~30 | Low — info display |
| Resizable hook | useResizable.ts | ~60 | Medium — mouse drag + localStorage |

### Shared Infrastructure (Untouched)
- Zustand store (`skillsLab.ts`) — keep as-is
- API layer (`lib/api.ts`) — keep as-is
- CM themes (`lib/cmBrandTheme.ts`, `lib/cmThemeV7.ts`) — keep as-is
- Types (`types/index.ts`) — keep as-is

### New Components Needed for Redesign
- Skill card with rich preview (description, tags, agent badges)
- Skill detail slide-over panel
- Chat-style skill browser
- Contextual toolbar / action bar
- Warm editorial typography system
- Agent assignment chips (not boring buttons)
- Visual rollout indicator (progress-bar-like, not a grid of chips)
- Installation wizard (step-by-step, not a form dump)
