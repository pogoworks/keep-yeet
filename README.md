# toss

A desktop app for fast, keyboard-driven image triage. Sort through folders of images and organize them into keep, maybe, and yeet (discard) categories with minimal friction.

Built for photographers, digital artists, and anyone who generates lots of images and needs a quick way to sort the gems from the garbage.

## features

### project-based organization
- Create projects with dedicated output folders
- Add multiple source folders to a single project
- Choose "move" or "copy" mode per folder
- Track progress and stats across folders

### browse mode
- Large preview with metadata panel
- Filmstrip navigation at bottom
- Glass morphism info panel with file details
- Auto-loading thumbnails with caching

### triage mode
- Full-screen image with classification controls
- Progress tracking (current / total)
- Auto-advance after each decision
- Three classifications: **keep** (electric chartreuse), **maybe** (soft violet), **yeet** (hot coral)

### review mode
- Three-column drag-and-drop grid
- Reclassify images by dragging between columns
- Multi-select with keyboard shortcuts
- Full preview panel for focused image
- Summary screen after completion

### safe file operations
- Keep/maybe files moved or copied to organized output folders
- Yeet files sent to system trash (recoverable)
- Output structure: `/<project>/keep/` and `/<project>/maybe/`

## keyboard shortcuts

### navigation
| key | action |
|-----|--------|
| ← / → | navigate images |

### triage mode
| key | action |
|-----|--------|
| Enter | keep |
| Backspace | yeet |
| Shift + Enter | maybe |
| Shift + Backspace | maybe |

### review mode
| key | action |
|-----|--------|
| ↑ / ↓ | navigate within column |
| Shift + ↑ / ↓ | extend selection |
| ← / → | navigate between columns |
| Alt + ← / → | move selected to adjacent column |
| Enter | reclassify as keep |
| Backspace | reclassify as yeet |
| Cmd/Ctrl + Enter | reclassify as maybe |

## stack

- **desktop**: Tauri 2 (Rust backend)
- **frontend**: React 19 + TypeScript + Vite
- **styling**: Tailwind CSS 4 + shadcn/ui
- **state**: Zustand with persistence
- **drag-drop**: dnd-kit
- **package manager**: Bun

## development

```bash
# install dependencies
bun install

# run the desktop app (Vite + Tauri together)
bun run dev

# run storybook for component development
bun run storybook

# build for production
bun run build

# direct Tauri CLI access
bun run tauri
```

## design

The app uses a dark-mode-first design with an "industrial precision meets electric energy" aesthetic.

**typography**: Dual font system with Syne (display/headings) and Space Grotesk (UI/body)

**color system**: OKLCH color space with semantic colors for each triage action:
- **keep**: Electric chartreuse — warm, affirming
- **maybe**: Soft violet — cool, contemplative
- **yeet**: Hot coral — warm, decisive

**effects**: Glass morphism panels, glow shadows on hover, smooth spring animations, and subtle noise texture overlays.

## project structure

```
toss/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── browse/         # Browse mode components
│   │   ├── triage/         # Triage mode components
│   │   └── review/         # Review mode components
│   ├── views/              # Top-level view components
│   ├── stores/             # Zustand state management
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities and Tauri wrappers
├── src-tauri/              # Rust backend
│   └── src/lib.rs          # Tauri commands
├── docs/                   # Documentation and feature plans
└── .storybook/             # Storybook configuration
```

## license

MIT
