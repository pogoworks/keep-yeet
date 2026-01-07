# Phase 3: Browse Mode UI

**Status:** Complete
**Completed:** 2026-01-07

## Summary

Implemented the Browse Mode UI for the Toss image triage application. Users can now select a folder, browse images with a filmstrip view, and navigate using keyboard shortcuts.

## Features Implemented

### Landing View
- Folder picker integration with `@tauri-apps/plugin-dialog`
- Recent folders list (persisted to localStorage)
- Error handling for empty folders
- Loading states

### Browse View
- **MainPreview**: Full-size image display with loading/error states
- **Filmstrip**: Horizontal scrollable thumbnails (180px)
  - Auto-scroll selected thumbnail to center
  - Progressive thumbnail loading
  - Click to select
- **InfoPanel**: Sidebar showing filename, dimensions, file size
- **Keyboard Navigation**: Left/Right arrows to navigate images

## Architecture

Followed Clean Architecture approach:

```
src/
├── views/
│   ├── BrowseView.tsx      # Page-level orchestration
│   └── LandingView.tsx     # Folder selection
├── components/
│   └── browse/
│       ├── Filmstrip.tsx       # Horizontal thumbnail strip
│       ├── FilmstripItem.tsx   # Individual thumbnail
│       ├── MainPreview.tsx     # Large image display
│       ├── InfoPanel.tsx       # Metadata sidebar
│       └── stories/            # Storybook stories
└── hooks/
    ├── useKeyboardNav.ts   # Arrow key navigation
    └── useAutoScroll.ts    # Auto-center selected thumbnail
```

## Key Decisions

1. **180px thumbnails** - Large thumbnails for better detail visibility
2. **Auto-scroll to center** - Selected thumbnail always scrolls to center
3. **Sidebar info panel** - Keeps layout simple, info always visible
4. **Progressive thumbnail loading** - Mode switches immediately, thumbnails load in background

## Files Created

- `src/views/BrowseView.tsx`
- `src/views/LandingView.tsx`
- `src/views/index.ts`
- `src/components/browse/Filmstrip.tsx`
- `src/components/browse/FilmstripItem.tsx`
- `src/components/browse/MainPreview.tsx`
- `src/components/browse/InfoPanel.tsx`
- `src/components/browse/index.ts`
- `src/components/browse/stories/*.stories.tsx` (4 stories)
- `src/hooks/useKeyboardNav.ts`
- `src/hooks/useAutoScroll.ts`

## Files Modified

- `src/App.tsx` - Added mode-based routing
- `src/lib/utils.ts` - Added `formatBytes()` utility

## Dependencies Added

- `@tauri-apps/plugin-dialog` - Folder picker
- `@tauri-apps/plugin-fs` - File system access

## Next Steps (Phase 4: Triage Mode)

- [ ] Add SessionDialog component (name your session)
- [ ] Add TriageControls component (KEEP/MAYBE/YEET buttons)
- [ ] Implement classify action + auto-advance
- [ ] Add keyboard shortcuts (K/M/Y)
- [ ] Add progress indicator
