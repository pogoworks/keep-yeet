# Image Triage App - Implementation Plan

## Stack
- **Runtime**: Tauri v2
- **Frontend**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS v4
- **State**: Zustand (with persist middleware)
- **Drag & Drop**: @dnd-kit/core
- **Package Manager**: Bun
- **Component Development**: Storybook v10

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

### Phase 3: Browse Mode ✅ COMPLETE
- [x] Build Filmstrip component (horizontal thumbnails)
- [x] Build MainPreview component
- [x] Implement keyboard navigation (← / →)
- [x] Add image info display (InfoPanel sidebar)
- [x] Create stories for each component
- [x] Wire up folder picker and mode routing

### Phase 4: Triage Mode ⏳ PENDING
- [ ] Add SessionDialog component (name your session)
- [ ] Add TriageControls component (KEEP/MAYBE/YEET)
- [ ] Implement classify action + auto-advance
- [ ] Add keyboard shortcuts (K/M/Y)
- [ ] Add progress indicator

### Phase 5: Review Mode ⏳ PENDING
- [ ] Build ReviewPanel with three columns
- [ ] Implement drag-and-drop between columns
- [ ] Add preview panel for selected image
- [ ] Implement Accept action (moves files, trashes YEET)

### Phase 6: Polish ⏳ PENDING
- [ ] Add persistence (recent folders, resume triage)
- [ ] Loading states and error handling
- [ ] Empty states and edge cases
- [ ] Animations and transitions

---

## Project Structure (Current)

```
toss/
├── .storybook/
│   ├── main.ts
│   └── preview.tsx
├── docs/
│   └── software-development-plan.md
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── stories/          # Storybook stories
│   │       │   └── button.stories.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       └── scroll-area.tsx
│   ├── hooks/                    # (ready for keyboard hooks)
│   ├── lib/
│   │   ├── tauri.ts              # Tauri command wrappers
│   │   └── utils.ts              # shadcn utilities
│   ├── stores/
│   │   └── useAppStore.ts        # Zustand store
│   ├── App.tsx
│   ├── index.css                 # Tailwind + shadcn theme
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                # All Tauri commands
│   │   └── main.rs
│   ├── capabilities/
│   │   └── default.json          # Permissions config
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── bun.lock
├── tsconfig.json
└── vite.config.ts
```

---

## Commands

```bash
bun run dev          # Vite dev server only (frontend)
bun run tauri dev    # Full Tauri desktop app
bun run storybook    # Storybook at localhost:6006
bun run build        # Production build
```

---

## App Modes & Views

### 1. Landing Mode (no folder selected)
- Centered panel with folder picker button
- Recent folders list (clickable)

### 2. Browse Mode (folder loaded)
- **Top/Center**: Large main preview of selected image
- **Bottom**: Horizontal filmstrip of thumbnails (scrollable)
- **Bottom-left**: Image info (filename, dimensions, size)
- **Top-right**: "Start Triage" button

### 3. Triage Mode (active sorting)
- **Session naming**: On clicking "Start Triage", prompt for session name (default: date-based like "triage-2024-01-07")
- Same layout as Browse
- **Bottom**: Three large buttons: KEEP (green), MAYBE (yellow), YEET (red)
- Progress indicator: "12 / 47"
- Auto-advances after each decision

### 4. Review Mode (triage complete)
- **Header**: Shows session name
- **Three columns**: KEEP | MAYBE | YEET
- Thumbnails in each column (draggable)
- **Right panel**: Preview of hovered/selected image
- **Bottom-right**: "Accept" button
- **Top-right**: X to cancel

### On Accept:
1. Create `/<source_folder>/<session_name>/keep/` folder
2. Create `/<source_folder>/<session_name>/maybe/` folder
3. Move KEEP files to keep folder
4. Move MAYBE files to maybe folder
5. Move YEET files to system trash

---

## Zustand Store (Implemented)

```typescript
// src/stores/useAppStore.ts

type Classification = "keep" | "maybe" | "yeet";
type AppMode = "landing" | "browse" | "triage" | "review";

interface ImageFile {
  id: string;
  path: string;
  name: string;
  thumbnailUrl: string | null;
  size: number;
  dimensions?: { width: number; height: number };
}

interface AppState {
  // Folder state
  currentFolder: string | null;
  recentFolders: string[];

  // Image state
  images: ImageFile[];
  selectedIndex: number;

  // Triage state
  mode: AppMode;
  sessionName: string | null;
  classifications: Record<string, Classification>;
  triageIndex: number;

  // Actions
  setCurrentFolder, addRecentFolder, setImages, updateImageThumbnail,
  selectImage, navigateNext, navigatePrev, setMode, startTriage,
  classify, reclassify, finishTriage, resetTriage, reset
}

// Selectors
useCurrentImage()      // Get currently selected image
useTriageProgress()    // { current, total }
useClassifiedImages()  // { keep: [], maybe: [], yeet: [] }
```

---

## Tauri Commands (Implemented)

```rust
// src-tauri/src/lib.rs

#[tauri::command]
async fn list_images(folder: String) -> Result<Vec<ImageInfo>, String>
// Scans folder for image files (.png, .jpg, .jpeg, .webp, .gif, .bmp)
// Returns id, path, name, size, width, height

#[tauri::command]
async fn get_thumbnail(app: AppHandle, path: String, size: Option<u32>) -> Result<String, String>
// Returns base64 data URL of resized image (default 150px)
// Caches to app_cache_dir/thumbnails/{hash}.jpg

#[tauri::command]
async fn get_image_data_url(path: String) -> Result<String, String>
// Returns full image as base64 data URL for preview

#[tauri::command]
async fn execute_triage(
    session_name: String,
    source_folder: String,
    keep_files: Vec<String>,
    maybe_files: Vec<String>,
    yeet_files: Vec<String>,
) -> Result<(), String>
// Creates session folders, moves files, trashes YEET files

#[tauri::command]
async fn move_to_trash(paths: Vec<String>) -> Result<(), String>
// Moves files to system trash (recoverable)
```

---

## TypeScript API (Implemented)

```typescript
// src/lib/tauri.ts

pickFolder(): Promise<string | null>
listImages(folder: string): Promise<ImageInfo[]>
getThumbnail(path: string, size?: number): Promise<string>
getImageDataUrl(path: string): Promise<string>
executeTriage(sessionName, sourceFolder, keepFiles, maybeFiles, yeetFiles): Promise<void>
moveToTrash(paths: string[]): Promise<void>
```

---

## Keyboard Shortcuts (To Implement)

| Key | Action |
|-----|--------|
| ← / → | Navigate images |
| K | Classify as KEEP |
| M | Classify as MAYBE |
| Y | Classify as YEET |
| Enter | Accept (in review mode) |
| Escape | Cancel / go back |
| Space | Start triage (in browse mode) |

---

## Dependencies (Installed)

### Frontend
- `@tauri-apps/api` ^2.9.1
- `@tauri-apps/plugin-dialog` ^2.2.0
- `@tauri-apps/plugin-fs` ^2.2.0
- `react` ^19.2.3
- `zustand` ^5.0.9
- `@dnd-kit/core` ^6.3.1
- `@dnd-kit/sortable` ^10.0.0
- `tailwindcss` ^4.1.18
- `storybook` ^10.1.11

### Rust (Cargo.toml)
- `tauri` 2
- `tauri-plugin-dialog` 2
- `tauri-plugin-fs` 2
- `image` 0.25
- `trash` 5
- `base64` 0.22
- `sha2` 0.10
- `hex` 0.4
- `tokio` 1 (full features)
