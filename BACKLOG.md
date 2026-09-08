# Excel-like Table Backlog

## Goal

Build a standalone React/Next table component that reuses the imported table markup ideas, but removes dependencies on the old project and adds Excel-like cell selection, background coloring, and notes based on mocked backend data.

## Scope Decisions

- Cell value editing is out of scope for the first implementation pass.
- Old project dependencies such as Redux slices, vector entities, chart components, journal selectors, and global helpers should be removed or replaced with local table-specific code.
- Static `techId`, `tech_id`, and hardcoded UUID-like identifiers should be replaced with new static random UUIDs. Do not add runtime generator functions for those replacements.
- Mock backend responses should live in a dedicated folder and be treated as the source of table data, available background colors, and `DataStatus` metadata.
- The first working version should favor clear local state and explicit functions over broad abstractions.
- Some cells can be locked for actions such as background changes and notes. Locked cells should remain selectable, but mutating actions should skip them and show that they are not editable.

## Proposed File Structure

- `src/app/page.tsx`
  - Loads mock data and renders the table demo.
- `src/types/index.ts`
  - Owns local table data contracts only.
- `src/mocks/table/table-data.ts`
  - Mock table cells that imitate the backend response.
- `src/mocks/table/background-colors.ts`
  - Mock list of allowed background colors.
- `src/mocks/table/index.ts`
  - Public mock exports.
- `src/components/table/table.tsx`
  - Top-level composition and table rendering.
- `src/components/table/table-cell.tsx`
  - Single cell rendering, selection state classes, context menu entry points.
- `src/components/table/table-toolbar.tsx`
  - Background color controls for selected cells.
- `src/components/table/table-context-menu.tsx`
  - Cell context menu with note actions.
- `src/components/table/data-status/data-status-note.tsx`
  - Note editor/popover. Can be reused but should be made controlled.
- `src/components/table/hooks/use-table-selection.ts`
  - Selection state: single click, drag range, `Ctrl + click`.
- `src/components/table/helpers/cell-key.ts`
  - Stable cell key helpers, range helpers, selection predicates.
- `src/components/table/table.module.css`
  - Table layout, selection states, note markers, toolbar/menu styling.

## Phase 1: Project Stabilization

- [x] Replace all static UUID-like `techId`, `tech_id`, and id hardcodes in table-related files with new random UUIDs.
- [x] Remove unused domain files if they are no longer referenced by the standalone table.
- [x] Replace missing imports with local implementations only when the behavior is still needed.
- [x] Delete old imports that belong to the source project and are not part of this feature.
- [x] Fix local types so `npm.cmd run build` reaches table-related code without missing symbol errors.

Acceptance criteria:

- `src/components/table` does not import from missing project modules.
- The project compiles far enough to expose real local errors, not missing old-app dependencies.

## Phase 2: Mock Backend Layer

- [x] Add mock table data with rows, columns, `colspan`, `rowspan`, formatted values, optional `data_status`, optional existing note, and optional background.
- [x] Add mock available background colors as backend-like objects with `alias`, `value`, and `tech_id`.
- [x] Render the table on `src/app/page.tsx` from mocks.

Acceptance criteria:

- Opening the app shows an actual table, not placeholder text.
- Mock shape is close enough to backend contracts that swapping to API data later will not require rewriting selection logic.

## Phase 3: Table Core Refactor

- [x] Split the current large `table.tsx` into focused components and helpers.
- [x] Keep rendering pure: cell visual state comes from props, mutations go through callbacks.
- [x] Remove old journal-specific styling rules unless a rule is still needed for the demo.
- [x] Preserve basic table features: row rendering, cell rendering, `colSpan`, `rowSpan`, background color, and note indicator.

Acceptance criteria:

- `table.tsx` is mostly composition.
- Cell rendering has no knowledge of backend mocks or app page state.
- Table still renders merged cells correctly.

## Phase 4: Cell Selection

- [x] Implement single-cell selection on click.
- [x] Implement drag range selection with mouse down, enter, and mouse up.
- [x] Implement `Ctrl + click` toggle selection for multiple cells.
- [x] Ensure selection uses stable cell keys rather than display text or array index alone.
- [x] Add visible styles for active cell and selected range.
- [x] Add a distinct selected-but-locked visual state for cells that cannot be changed.

Acceptance criteria:

- Clicking selects exactly one cell.
- Dragging from one cell to another selects a rectangular range.
- `Ctrl + click` toggles independent cells without clearing the previous selection.
- Selection remains understandable when cells have different content.
- Locked cells can be selected, including as part of a range, but they are visually different from editable selected cells.

## Phase 5: Background Color Actions

- [x] Show background controls only when at least one cell is selected.
- [x] Render allowed colors from mock backend data.
- [x] Apply chosen background to selected cells that allow background changes.
- [x] Keep updates in local component state for now.
- [x] Preserve incoming `DataStatus` background priority rules explicitly, or document that manual background overrides it.

Recommended rule:

- Manual background color should override both backend color sources while it is stored locally.
- `DataStatus.background` should override the cell's base `data.color` when there is no manual background.
- `Без заливки` should be represented as `null` and should remove the local manual background.
- Locked selected cells should be skipped when applying a background color.
- The toolbar should communicate how many selected cells can receive the action, for example `Выбрано 9, доступно для заливки 6`.

Acceptance criteria:

- Selecting one or many cells and choosing a color changes the background only for editable selected cells.
- Color options come from mocks, not hardcoded buttons inside JSX.
- If no selected cells allow background changes, background controls are disabled.

## Phase 6: Notes And Context Menu

- [x] Add right-click context menu on cells.
- [x] Show `Добавить примечание` when the cell has no note.
- [x] Show `Удалить примечание` when the cell has a note.
- [x] Add a controlled note editor for adding or changing note text.
- [x] Store note changes in local component state.
- [x] Show a small visual marker for cells with notes.

Acceptance criteria:

- Right-click opens a menu near the pointer.
- Adding a note marks the cell and persists while the page is open.
- Deleting a note removes the marker and note state.

## Phase 7: Verification And Cleanup

- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run lint` if the Next lint command is available in this setup.
- [x] Start `npm.cmd run dev` and manually verify click, drag, `Ctrl + click`, background changes, and context menu notes.

Acceptance criteria:

- Build passes.
- The table works in the browser for all requested interactions.
- Remaining limitations are documented in this file or in the final implementation notes.

## Later Enhancements

- Restore editable cell values with a local editing model instead of old Redux state.
- Add explicit `Сохранить` / `Отмена` controls for pending local table changes before sending them to an API.
- Add keyboard navigation with arrows, `Shift + arrows`, copy/paste, and delete-to-clear.
- Persist table edits through an API adapter.
- Add undo/redo for background and note changes.
- Add virtualization if real backend tables are large enough to need it.
