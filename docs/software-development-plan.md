# Image Triage App - Implementation Plan

## Stack
- **Runtime**: Tauri v2
- **Frontend**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS v4
- **State**: Zustand (runtime) + JSON files (persistence)
- **Drag & Drop**: @dnd-kit/core
- **Package Manager**: Bun
- **Component Development**: Storybook v10

---

## Core Concept: Project-Based Workflow

Toss uses a **project-based architecture** with persistent source folders:

1. **Create a Project** - User specifies a project name and output location
2. **Add Source Folders** - Link folders (e.g., SD outputs) to the project
3. **Triage** - Work through images with KEEP/MAYBE/YEET
4. **Output** - Files are moved/copied to the project folder
5. **Revisit Anytime** - Source folders stay linked; new images appear automatically

### Key Principles

- **Live Reference**: Source folders are scanned on open. No stale caches. If files are gone, they're gone.
- **Move or Copy**: User chooses per folder when adding (like Premiere proxy settings)
- **No "Triaged" State**: Folders are always active. If there are images, triage them. If empty, you're caught up.
- **Stats are Derived**: Keep/maybe/yeet counts come from scanning the file system, not from stored metadata.

---

## Data Storage

### Central Registry (App Data)
```
~/Library/Application Support/com.pgwrks.toss/
├── config.json          # App settings (default output location, preferences)
└── projects.json        # List of all projects
```

**projects.json**
```json
[
  {
    "id": "abc123",
    "name": "SD Project",
    "path": "/Users/me/Documents/Toss/SD Project",
    "created_at": "2024-01-07T12:00:00Z"
  }
]
```

### Per-Project File
```
/Users/me/Documents/Toss/SD Project/
├── toss-project.json    # Project config and folder list
├── batch-001/
│   ├── keep/
│   └── maybe/
└── portraits/
    ├── keep/
    └── maybe/
```

**toss-project.json**
```json
{
  "id": "abc123",
  "name": "SD Project",
  "created_at": "2024-01-07T12:00:00Z",
  "folders": [
    {
      "id": "folder1",
      "source_path": "/Users/me/stable-diffusion/outputs/batch-001",
      "output_mode": "move",
      "added_at": "2024-01-07T12:00:00Z"
    },
    {
      "id": "folder2",
      "source_path": "/Users/me/Photos/portraits",
      "output_mode": "copy",
      "added_at": "2024-01-08T10:00:00Z"
    }
  ]
}
```

---

## Output Structure

When triage is accepted:

```
/Users/me/Documents/Toss/SD Project/
├── batch-001/                    # Named after source folder
│   ├── keep/
│   │   ├── 00001.png
│   │   └── 00002.png
│   └── maybe/
│       └── 00003.png
├── portraits/
│   ├── keep/
│   │   └── portrait_01.jpg
│   └── maybe/
└── toss-project.json
```

- **Move mode**: Source files are moved, source folder empties out
- **Copy mode**: Source files are copied, originals stay in place
- **YEET**: Files go to system trash (recoverable)

---

## Progress Tracker

### Phase 1: Project Setup ✅ COMPLETE
- [x] Initialize Tauri + React + Vite project (with Bun)
- [x] Install and configure Tailwind v4 + shadcn/ui
- [x] Set up Zustand store with basic state
- [x] Configure Tauri permissions (fs, dialog)
- [x] Set up Storybook for component development

### Phase 2: Core File Operations ✅ COMPLETE
- [x] Implement `list_images` command
- [x] Implement `get_thumbnail` with caching
- [x] Implement `get_image_data_url` command
- [x] Implement `execute_triage` command
- [x] Implement `move_to_trash` command
- [x] Create TypeScript wrappers for Tauri commands
- [x] Wire up folder picker via `@tauri-apps/plugin-dialog`

### Phase 3: Browse Mode Components ✅ COMPLETE
- [x] Build Filmstrip component (horizontal thumbnails)
- [x] Build MainPreview component
- [x] Implement keyboard navigation (← / →)
- [x] Add image info display (InfoPanel sidebar)
- [x] Create stories for each component
- [x] Build reusable browse components (will be used in triage flow)

### Phase 4: Project System ✅ COMPLETE
- [x] Implement JSON-based project storage (Rust side)
  - [x] Central registry: create/list/delete projects
  - [x] Per-project config: read/write toss-project.json
- [x] Create TypeScript wrappers for project commands
- [x] Create ProjectListView (home screen)
- [x] Create CreateProjectDialog (name + output location picker)
- [x] Create ProjectDetailView (folder list, stats)
- [x] Add source folder flow (pick folder, choose move/copy)
- [x] Update Zustand store for project state
- [x] Wire up navigation in App.tsx

### Phase 5: Triage Mode ✅ COMPLETE
- [x] Integrate browse components into project flow
- [x] Add TriageControls component (KEEP/MAYBE/YEET buttons)
- [x] Implement classify action + auto-advance
- [x] Add keyboard shortcuts (K/M/Y)
- [x] Add progress indicator
- [x] Add classification badges to filmstrip thumbnails
- [x] Update execute_triage backend for project paths + move/copy modes

### Phase 6: Review Mode 🔄 NEXT
- [ ] Build ReviewPanel with three columns
- [ ] Implement drag-and-drop between columns
- [ ] Add preview panel for selected image
- [ ] Implement Accept action (calls execute_triage)

### Phase 7: Project Overview ⏳ PENDING
- [ ] Show all kept/maybe images across folders in project
- [ ] Filter by folder, classification
- [ ] Quick preview and navigation

### Phase 8: Polish ⏳ PENDING
- [ ] Settings view (default output location, preferences)
- [ ] Loading states and error handling
- [ ] Empty states ("All caught up!", "No projects yet")
- [ ] Animations and transitions
- [ ] Keyboard shortcuts for navigation (N for new project, etc.)

### Phase 9: Future Ideas ⏳ PARKED
- [ ] Subcategories - optional pass to assign images to subcategories creating subfolders within keep/maybe

---

## App Flow & Views

### 1. Project List (Home)
- List of all projects with name, folder count, last updated
- "New Project" button
- Click project → Project Detail
- Empty state if no projects

### 2. Create Project Dialog
- Project name input
- Output location picker (default: ~/Documents/Toss/)
- Create button → creates folder + toss-project.json

### 3. Project Detail
- Project name header
- List of source folders:
  - Folder name (from source path)
  - Image count (scanned live)
  - Output mode badge (move/copy)
  - Click → Browse/Triage
- "Add Folder" button → folder picker + move/copy choice
- Stats: total kept, total maybe (derived from output folders)
- Back to project list

### 4. Browse Mode (per folder)
- Scans source folder on open
- MainPreview + Filmstrip + InfoPanel (existing components)
- "Start Triage" button (or empty state if no images)
- Back to project detail

### 5. Triage Mode
- Same layout as Browse
- KEEP (K) / MAYBE (M) / YEET (Y) buttons
- Progress indicator: "12 / 47"
- Auto-advance after classification
- "Finish" → Review Mode

### 6. Review Mode
- Three columns: KEEP | MAYBE | YEET
- Drag-and-drop to reclassify
- Preview panel on hover/select
- "Accept" → executes triage (move/copy files)
- "Back" → return to triage

### 7. Project Overview
- Grid of all kept/maybe images in project
- Filter by folder, classification
- Click to preview full size

---

## Tauri Commands

### Existing (Phase 2)
```rust
list_images(folder: String) -> Vec<ImageInfo>
get_thumbnail(path: String, size: Option<u32>) -> String
get_image_data_url(path: String) -> String
move_to_trash(paths: Vec<String>) -> ()
```

### New for Phase 4
```rust
// Central registry
get_app_data_dir() -> String
list_projects() -> Vec<ProjectSummary>
create_project(name: String, output_path: String) -> Project
delete_project(project_id: String) -> ()

// Per-project operations
get_project(project_path: String) -> Project
add_folder_to_project(project_path: String, source_path: String, output_mode: String) -> Folder
remove_folder_from_project(project_path: String, folder_id: String) -> ()

// Stats (derived from file system)
get_folder_stats(project_path: String, folder_id: String) -> FolderStats
get_project_stats(project_path: String) -> ProjectStats
```

### Updated for Phase 5
```rust
execute_triage(
    project_path: String,
    folder_id: String,
    source_folder: String,
    output_mode: String,  // "move" | "copy"
    keep_files: Vec<String>,
    maybe_files: Vec<String>,
    yeet_files: Vec<String>,
) -> ()
```

---

## Zustand Store

```typescript
interface AppState {
  // Navigation
  view: 'projects' | 'project-detail' | 'browse' | 'triage' | 'review' | 'overview';

  // Current context
  currentProject: Project | null;
  currentFolder: Folder | null;

  // Project list (cached)
  projects: ProjectSummary[];

  // Image state (for browse/triage/review)
  images: ImageFile[];
  selectedIndex: number;
  classifications: Record<string, Classification>;
  triageIndex: number;

  // Actions
  loadProjects(): Promise<void>
  selectProject(project: Project): void
  selectFolder(folder: Folder): void
  // ... existing image actions
}
```

---

## Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| ← / → | Browse/Triage | Navigate images |
| K | Triage | Classify as KEEP |
| M | Triage | Classify as MAYBE |
| Y | Triage | Classify as YEET |
| Enter | Review | Accept triage |
| Escape | Any | Go back / Cancel |
| N | Project List | New project |

---

## Dependencies

### Frontend
- `@tauri-apps/api` ^2
- `@tauri-apps/plugin-dialog` ^2
- `@tauri-apps/plugin-fs` ^2
- `react` ^19
- `zustand` ^5
- `@dnd-kit/core` ^6
- `@dnd-kit/sortable` ^10
- `tailwindcss` ^4
- `storybook` ^10

### Rust (Cargo.toml)
- `tauri` 2
- `tauri-plugin-dialog` 2
- `tauri-plugin-fs` 2
- `image` 0.25
- `trash` 5
- `base64` 0.22
- `sha2` 0.10
- `hex` 0.4
- `tokio` 1
- `serde_json` 1
- `uuid` 1 (for generating IDs)

---

## Commands

```bash
bun run dev          # Vite dev server only (frontend)
bun run tauri dev    # Full Tauri desktop app
bun run storybook    # Storybook at localhost:6006
bun run build        # Production build
```
