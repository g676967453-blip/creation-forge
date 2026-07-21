---
name: ui-must-be-editable-in-godot-editor
description: All art assets and UI must remain editable in the Godot editor after AI makes changes. Avoid pure-code UI generation.
type: project
originSessionId: 8535005d-1861-4d92-8414-c5d690f0e52c
---
All UI nodes (buttons, labels, panels, containers) should be created as `.tscn` scene files, not built purely in GDScript via `Label.new()` / `Button.new()`. Dynamically spawned elements (e.g. floating damage numbers) should reference a pre-built `.tscn` template scene that the user can open and edit visually.

**Why:** The user is learning Godot and needs to be able to open scenes in the editor to visually adjust positions, colors, fonts, sizes, and layouts. Code-generated UI is invisible in the editor.

**How to apply:**
- New features: create `.tscn` scene files for UI components, use `@onready var` to reference nodes
- Existing code-built UI: migrate gradually as each feature is touched — don't rewrite everything at once
- Dynamic/spawned elements: create a template `.tscn` that gets instanced via `preload().instantiate()`, so the template remains editable
- When writing detailed requirements docs, specify which nodes go into which `.tscn` file
