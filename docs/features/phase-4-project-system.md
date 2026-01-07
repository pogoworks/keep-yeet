# Phase 4: Project System

## Overview
Implement the project-based architecture that allows users to create projects, add source folders, and manage their image triage workflow persistently.

## Progress Log

### 2026-01-07 - Phase Complete
- Implemented all Rust backend commands for project management
- Created TypeScript wrappers for all project commands
- Updated Zustand store with project state and actions
- Built ProjectListView, ProjectDetailView, CreateProjectDialog, AddFolderDialog
- Updated BrowseView to work with project-based flow
- Removed obsolete LandingView
- All builds pass (TypeScript + Rust)

### 2026-01-07 - Code Review Fixes
- Fixed path separator hardcoding (now handles both Unix and Windows)
- Fixed path traversal vulnerability (project names are now sanitized)
- Fixed async error handling in callback functions

### Notes for Phase 5
The following issues were identified but are deferred to Phase 5 (Triage Mode):
- `execute_triage` needs to implement "copy" mode (currently only moves)
- File name collision handling when moving/copying to keep/maybe folders
- Transaction semantics for partial triage failures (rollback mechanism)

---

## Implementation Tasks

### 1. Rust Backend - Project Storage System

**Data Structures:**
```rust
// Central registry stored in ~/Library/Application Support/com.pgwrks.toss/projects.json
struct ProjectSummary {
    id: String,
    name: String,
    path: String,
    created_at: String,
}

// Per-project config stored in {project_path}/toss-project.json
struct Project {
    id: String,
    name: String,
    created_at: String,
    folders: Vec<Folder>,
}

struct Folder {
    id: String,
    source_path: String,
    output_mode: String,  // "move" | "copy"
    added_at: String,
}

struct FolderStats {
    source_count: u32,    // Images in source folder
    keep_count: u32,      // Images in keep subfolder
    maybe_count: u32,     // Images in maybe subfolder
}

struct ProjectStats {
    total_keep: u32,
    total_maybe: u32,
    folder_stats: Vec<FolderStats>,
}
```

**Commands to implement:**
- [ ] `get_app_data_dir()` - Returns app data directory path
- [ ] `list_projects()` - Lists all projects from registry
- [ ] `create_project(name, output_path)` - Creates project folder and registry entry
- [ ] `delete_project(project_id)` - Removes project from registry (optionally delete files)
- [ ] `get_project(project_path)` - Reads toss-project.json
- [ ] `add_folder_to_project(project_path, source_path, output_mode)` - Adds folder
- [ ] `remove_folder_from_project(project_path, folder_id)` - Removes folder
- [ ] `get_folder_stats(project_path, folder_id)` - Stats for one folder
- [ ] `get_project_stats(project_path)` - Aggregate stats

### 2. TypeScript Wrappers

Add to `src/lib/tauri.ts`:
- Interfaces matching Rust structs
- Wrapper functions for all new commands

### 3. Zustand Store Updates

Update `src/stores/useAppStore.ts`:
- New view types: `'projects' | 'project-detail' | 'browse' | 'triage' | 'review'`
- Project state: `currentProject`, `currentFolder`, `projects`
- Project actions: `loadProjects()`, `selectProject()`, `selectFolder()`

### 4. UI Components

**ProjectListView (`src/views/ProjectListView.tsx`)**
- Grid/list of project cards
- Each card shows: name, folder count, last updated
- "New Project" button
- Empty state when no projects

**CreateProjectDialog (`src/components/CreateProjectDialog.tsx`)**
- Project name input
- Output location picker (defaults to ~/Documents/Toss)
- Create button

**ProjectDetailView (`src/views/ProjectDetailView.tsx`)**
- Project header with name
- List of source folders with stats
- "Add Folder" button
- Back navigation

**AddFolderDialog (`src/components/AddFolderDialog.tsx`)**
- Folder picker
- Move/Copy toggle
- Add button

### 5. Navigation Updates

Update `App.tsx` to handle new views:
- `projects` -> ProjectListView (new home)
- `project-detail` -> ProjectDetailView
- `browse` -> BrowseView (existing)
- `triage` -> TriageView (Phase 5)
- `review` -> ReviewView (Phase 5)

---

## File Changes Summary

| File | Change Type |
|------|-------------|
| `src-tauri/Cargo.toml` | Add `uuid` dependency |
| `src-tauri/src/lib.rs` | Add project commands and structs |
| `src/lib/tauri.ts` | Add project type interfaces and wrappers |
| `src/stores/useAppStore.ts` | Add project state and actions |
| `src/App.tsx` | Update routing for new views |
| `src/views/ProjectListView.tsx` | New file |
| `src/views/ProjectDetailView.tsx` | New file |
| `src/views/index.ts` | Export new views |
| `src/components/CreateProjectDialog.tsx` | New file |
| `src/components/AddFolderDialog.tsx` | New file |

---

## Testing Checklist

- [ ] Can create a new project with name and location
- [ ] Project appears in project list
- [ ] Can open project detail view
- [ ] Can add source folder to project
- [ ] Folder stats display correctly
- [ ] Can remove folder from project
- [ ] Can delete project
- [ ] Navigation between views works correctly
- [ ] Empty states display appropriately
