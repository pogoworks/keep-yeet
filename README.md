# toss

image triage app.

quickly sort through folders of images with a clean, keyboard-driven workflow.

## features

- **browse mode**: filmstrip view with large preview, arrow key navigation
- **triage mode**: classify images as keep / maybe / yeet with single keypresses
- **review mode**: drag-and-drop to reassign before confirming
- **session naming**: organizes outputs into `/<session>/keep/` and `/<session>/maybe/` folders
- **safe deletes**: yeet sends files to system trash (recoverable)

## stack

- tauri v2 (rust backend)
- react 19 + typescript + vite
- tailwind css v4 + shadcn/ui
- zustand (state management)
- storybook (component development)

## development

```bash
# install dependencies
bun install

# run the desktop app
bun run tauri dev

# run storybook
bun run storybook

# build for production
bun run tauri build
```

## keyboard shortcuts

| key | action |
|-----|--------|
| ← / → | navigate images |
| k | keep |
| m | maybe |
| y | yeet |
| space | start triage |
| enter | accept |
| esc | cancel |

## license

mit
