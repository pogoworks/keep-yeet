# Codebase Audit Report

**Date:** 2026-01-07

---

## Action Checklist

- [ ] Add toast notifications for failed operations ([see #1](#1-silent-error-handling-user-facing))
- [ ] Add tests for `execute_triage` and file operations ([see #2](#2-no-test-coverage))
- [x] Delete `DraggableCard.tsx` and barrel export ([see #3](#3-unused-component-draggablecard))
- [x] Remove `console.log` from `startTriage` ([see #4](#4-debug-consolelog-in-store))

---

## Project Context

| Attribute | Value |
|-----------|-------|
| **Stage** | Day 1-2 of development (43 commits, all from today) |
| **Team** | Solo developer (pogoworks) with Claude Code assistance |
| **Velocity** | Very high - major features landing every few hours |
| **Test Coverage** | 0% (no test files exist) |
| **Known Issues** | None documented |

**Implication:** This is greenfield development moving fast. Most "issues" found are normal for this stage. The codebase is well-structured for its age.

---

## Severity Categories

| Category | Meaning |
|----------|---------|
| **Blocking** | Causes bugs, crashes, or security issues NOW |
| **Risky** | Will likely cause problems as codebase grows |
| **Friction** | Annoys developers but doesn't break things |
| **Cosmetic** | Style preference, not wrong |

---

## Blocking Issues

**None found.** The codebase is solid for its current stage.

---

## Risky Issues

### 1. Silent Error Handling (User-Facing)

**Severity:** Risky

**Evidence:** All 14 `try/catch` blocks log to console.error but show nothing to users:

```typescript
// src/views/ProjectListView.tsx:51
} catch (err) {
  console.error("Failed to delete project:", err);
}
// User sees: nothing. Operation just didn't work.
```

**Files affected:**
- `src/views/ProjectListView.tsx` - delete project, reload
- `src/views/ReviewView.tsx` - execute triage
- `src/components/CreateProjectDialog.tsx` - create project
- `src/components/AddFolderDialog.tsx` - add folder

**Why this matters:** When operations fail, users have no feedback. They'll retry, get confused, or think the app is broken.

**Current workaround:** None. Errors are invisible.

**Recommendation:** Add toast/alert for user-facing operations. This becomes critical as the app is used on real folders.

---

### 2. No Test Coverage

**Severity:** Risky

**Evidence:** `ls src/**/*.test.* src/**/*.spec.*` returns no files.

**Critical untested paths:**
- `execute_triage` - moves/deletes actual user files
- `move_to_trash` - permanent deletion
- Classification state logic in Zustand store
- Race condition handling in image loading

**Why this matters:** The app manipulates user files. A bug in `execute_triage` could move files to wrong locations or fail to trash properly.

**Recommendation:** At minimum, add tests for:
1. `execute_triage` with edge cases (empty arrays, missing files)
2. Zustand store classification logic
3. The image loading session/race condition handling

---

## Friction Issues

### 3. Unused Component: DraggableCard

**Severity:** Friction

**Investigation:**
```bash
$ git log --oneline -- src/components/review/DraggableCard.tsx
af8fc83 feat: implement Review Mode with kanban-style drag-and-drop

$ git show af8fc83 --date=relative | head -5
Date:   7 hours ago
```

**What happened:** Created 7 hours ago as part of Review Mode. The commit also created `ReviewListItem.tsx` which uses the same `useDraggable` hook. It appears `DraggableCard` was an initial attempt that got replaced by `ReviewListItem`, but wasn't cleaned up.

**Evidence it's unused:**
```bash
$ grep -r "DraggableCard" src/ --include="*.tsx" | grep import
# (no results outside its own files)
```

**Recommendation:** Delete `src/components/review/DraggableCard.tsx` and remove from barrel export. It's clearly superseded by `ReviewListItem`.

---

### 4. Debug Console.log in Store

**Severity:** Friction

**Location:** `src/stores/useAppStore.ts:207-219`

```typescript
startTriage: () => {
  console.log("[startTriage] Called with:", { ... });
  // ...
  console.log("[startTriage] State updated to triage view");
},
```

**Status:** ACCIDENTAL - these are debug logs that should be removed before shipping.

**Recommendation:** Remove before release. Not urgent for development.

---

## Cosmetic Issues / Not Worth Fixing

### 5. Duplicated Input Check in Keyboard Hooks

**Pattern:** 6 hooks have identical 5-line check:
```typescript
if (
  e.target instanceof HTMLInputElement ||
  e.target instanceof HTMLTextAreaElement
) {
  return;
}
```

**Files:** `useKeyboardNav.ts`, `useLocalKeyboardNav.ts`, `useTriageKeys.ts`, `useTabNavKeys.ts`, `useReviewKeys.ts`, `useEscapeNav.ts`

**Why NOT worth fixing:**
- It's 5 lines, not 50
- The logic never changes (input/textarea detection is stable)
- Extracting it adds indirection for minimal benefit
- Each hook is already small and self-contained

**Recommendation:** Leave it. The duplication cost is lower than the abstraction cost.

---

### 6. Persist Middleware Configuration

**Location:** `src/stores/useAppStore.ts:303-307`

```typescript
persist(
  (set, get) => ({ /* store */ }),
  {
    name: "toss-storage",
    partialize: () => ({}), // Don't persist anything for now
  }
)
```

**Status:** INTENTIONAL - comment explicitly says "for now"

**Why it exists:** The developer set up the infrastructure for future persistence but hasn't needed it yet.

**Recommendation:** No action. Either remove when confirmed unnecessary, or implement when needed. Not a problem either way.

---

### 7. Similar Keyboard Navigation Hooks

**Hooks:**
- `useKeyboardNav` - coupled to store, triage-view-only
- `useLocalKeyboardNav` - callback-based, flexible

**Why NOT worth unifying:**
- They serve different purposes (one is global, one is local)
- Forcing them together would create awkward conditional logic
- The codebase is small enough that both are discoverable

**Recommendation:** Leave as-is. If keyboard handling grows more complex, revisit.

---

### 8. Duplicated Image Loading Logic

**Files:** `ImageWorkspace.tsx` and `useFolderSession.ts`

**Investigation:**
```bash
$ git log --oneline -- src/hooks/useFolderSession.ts src/views/ImageWorkspace.tsx
# Both files evolved together, same commits
```

**Evidence of actual divergence:** None found. The code is identical.

**Why it exists:** `useFolderSession` was extracted for `FolderBrowseView`, but `ImageWorkspace` wasn't updated to use it.

**Recommendation:** Low priority. If either file gets modified, the developer should remember to update both (or refactor at that point). No evidence of bugs from the duplication yet.

---

## Security Review

### Path Handling: Adequate

**Sanitization exists:**
```rust
// src-tauri/src/lib.rs:214-220
fn sanitize_name(name: &str) -> String {
    name.chars()
        .filter(|c| !matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0'))
        .collect::<String>()
        .trim()
        .to_string()
}
```

**File output uses basename only:**
```rust
// src-tauri/src/lib.rs:540-541
if let Some(file_name) = src.file_name() {
    let dest = keep_folder.join(file_name);  // Can't traverse
```

**Finding:** Path traversal is properly prevented for:
- Project names (sanitized)
- File outputs (basename extraction)
- File inputs (come from `list_images` which only reads a user-selected directory)

**Recommendation:** No action needed. Security model is sound.

### Trash Deletion: Safe

Uses the `trash` crate which sends to OS trash (recoverable), not permanent delete.

---

## Error Handling Audit

### Backend (Rust): Good

All Tauri commands return `Result<T, String>` with descriptive error messages:
```rust
.map_err(|e| format!("Failed to create keep folder: {}", e))
```

### Frontend (React): Needs Work

| Pattern | Count | User Visibility |
|---------|-------|-----------------|
| `console.error(...)` | 14 | None |
| Toast/Alert | 0 | N/A |
| Error state UI | 0 | N/A |

**Impact:** Users can trigger operations that fail silently.

---

## Rust Backend Notes

### Unused Parameter (Intentional)

```rust
// src-tauri/src/lib.rs:509
_source_folder: String, // Kept for API consistency, folder info comes from project config
```

**Status:** INTENTIONAL - documented inline. The parameter exists for API stability.

**Recommendation:** No action. The underscore prefix follows Rust conventions.

### Duplicated Counting Logic

`get_folder_stats` and `get_project_stats` have similar loops:
```rust
let keep_count = count_images_in_dir(&output_dir.join("keep"));
let maybe_count = count_images_in_dir(&output_dir.join("maybe"));
```

**Why NOT worth fixing:**
- It's 4 lines duplicated across 2 functions
- Each function has different iteration logic around it
- Extracting would save ~4 lines but add a new function to understand

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Blocking | 0 | - |
| Risky | 2 | Address before real user testing |
| Friction | 2 | Clean up when convenient |
| Cosmetic/Not Worth Fixing | 4 | Leave alone |

### Recommended Actions (Priority Order)

1. **Add user-visible error handling** for critical operations (create project, execute triage, add folder)
2. **Add minimal tests** for file operations (`execute_triage`, trash handling)
3. **Delete DraggableCard.tsx** when touching review components
4. **Remove debug logs** before release

### What's Actually Good

- Clean component structure with proper separation
- Consistent patterns (CVA variants, barrel exports)
- Sound security model for file handling
- Sensible state management with Zustand
- Well-typed TypeScript throughout

This is a well-built codebase for day 1-2 of development.
