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

## Next Phases

These phases describe the next implementation direction after the first standalone table pass.

## Phase 8: Cell Editor Model

Scope agreed on 2026-09-09: this phase delivers contracts, permissions, mocks, and integration with existing actions. Opening editors and editing values belong entirely to Phase 9.

Implementation documents for GPT-5.5:

- [Design and agreed rules](docs/superpowers/specs/2026-09-09-phase8-cell-editor-model-design.md).
- [Step-by-step implementation plan](docs/superpowers/plans/2026-09-09-phase8-cell-editor-model.md).

- [x] Extend the local cell contract with explicit `text`, `textarea`, `number`, `select`, `date`, and `readonly` editor metadata.
- [x] Add required raw `value` separately from `formatted_value`; keep static rendering based on `formatted_value`.
- [x] Add optional per-action permissions for value, background, and note changes; preserve `editable: false` as the overriding prohibition on all mutations.
- [x] Compute capabilities through one helper; editor absence or `readonly` prevents value editing but does not itself prohibit background or note changes.
- [x] Use background capability for palette availability, counts, and mutation guards; use note capability for menu/editor availability and all note mutation guards.
- [x] Keep action-only cells selectable with ordinary selection styling; use locked styling only when all three actions are prohibited.
- [x] Add explicit mock metadata and a separate demo table covering editor types, raw/display values, and permission combinations.

Implementation note, 2026-09-09:

- Phase 8 contract, mocks, permission integration, build, lint, and manual browser checklist are complete.
- Value editor opening, value input, keyboard editing, pending values, save/cancel, API, navigation, and virtualization remain in later phases.

Acceptance criteria:

- No value editor is mounted or opened; normal selection and existing background/note behavior remain available.
- Editor choice and permissions are not inferred from `field`, `comments_id`, or cell contents.
- Missing/null editor does not lock cells with permitted actions; missing permissions preserve existing background/note defaults.
- Fully locked cells remain selectable and existing notes remain readable.
- Build, lint, and the plan's manual browser checklist pass; no automated tests are added.

## Phase 9: Cell Value Editing

Scope and interaction rules agreed on 2026-09-09. Implementation documents for GPT-5.5:

- [Design and agreed rules](docs/superpowers/specs/2026-09-09-phase9-cell-value-editing-design.md).
- [Step-by-step implementation plan](docs/superpowers/plans/2026-09-09-phase9-cell-value-editing.md).

- [x] Use the explicit raw values, editor metadata, and capabilities introduced in Phase 8.
- [x] Restore editable cell values with a local editing model instead of old Redux state.
- [x] Render the active editor only while a cell is in edit mode.
- [x] Apply the edited value to local pending state on `Enter`, then close edit mode while keeping the same cell active and selected.
- [x] Apply the edited value locally when clicking outside the value editor, close the editor, and retain the changed-value marker until the value matches the loaded value or a future save succeeds.
- [x] On `Esc`, restore the exact pending value/absence of an override from before the editor opened, then close it. This includes rolling back immediately applied select/date choices, while preserving changes made before the current session.
- [x] Clear selection, active cell, range anchor, and drag state when clicking outside the table interaction area. Apply an open value edit locally before clearing selection. The table toolbar, context menu, note editor, and value-editor popups belong to the table interaction area, including portaled content.
- [x] Preserve or replace the old changed-value visual marker. The imported input styles used a yellow bottom border for changed values, so pending value changes should remain visibly marked in the new table UI.

Implementation note, 2026-09-09:

- Phase 9 local value editing is implemented with table-local pending values, active-only editors, select/date panels, date calendar arithmetic, owner-scoped outside handling, and a yellow pending-value marker.
- `npm.cmd run build` and `npm.cmd run lint` pass. `git diff --check` is part of final verification for this phase.
- Manual browser smoke checks were run on `http://localhost:3001`: single click selection without editing; printable key replacement after selection; double-click text editing; trim-on-commit; Enter commit with focus returning to the table; outside click commit plus selection clear; number min clamp only on commit; dot-to-comma normalization; invalid numeric characters rejected; select choice applies immediately and stays open; select Esc restores snapshot; date calendar opens, clear applies immediately and stays open; Enter closes date panel; context menu and note portal remain usable.
- The full long-form checklist remains a manual regression aid for future phases. Automated tests were not added by project rule.

Interaction rules (implementation belongs to this phase):

- Single click selects a cell without opening a value editor.
- Double click or `Enter` opens the current effective raw value only when `canEditValue` permits it. Text caret starts at the end without selecting text.
- Typing a printable character into a selected text/textarea/number cell starts replacement input. Number replacement starts only with a valid numeric character; modifiers for shortcuts do not start editing.
- Starting an editor reduces selection to the single edited cell, including when Enter or typing starts from a multi-selection. Other previously selected cells are unchanged; Escape does not restore the old range.
- Select and date controls do not open on normal cell click; a dedicated dropdown/calendar affordance opens the picker, with keyboard opening through `Enter`.
- Selecting an option or date immediately applies the value locally and updates the changed-value marker, but keeps the select/calendar open for further choices.
- Enter or clicking outside a select/date editor closes it retaining its latest choice; Escape restores the value from before opening that editor.
- Select and date editors provide a clear action that sets the value to null. Dates outside configured min/max are unavailable; Phase 9 date editing uses a calendar without manual date text entry.
- Render editor controls from explicit metadata, separately from cell selection state.
- Numeric editor input uses a comma as the displayed decimal separator and accepts a dot by normalizing it to a comma. Stored values remain JavaScript numbers or null. Letters and invalid symbol placement must not be accepted, including through paste.
- Empty numeric input and incomplete numeric drafts with no digits, such as `-`, `,`, or `-,`, become null when the edit is applied; they do not block leaving the editor.
- On Enter or leaving the numeric editor, clamp a finite numeric value to the configured min/max. Apply the same rule to typed and pasted input. Do not clamp while typing; absent boundaries impose no limit, and null remains null.
- Do not round manually entered or pasted numbers to step. Step only controls increment/decrement buttons if such controls are provided.
- Text and textarea apply trim on commit; an empty result becomes null. Internal spaces and line breaks are retained, while leading/trailing whitespace is removed. Existing note text semantics are unchanged.
- Text maxLength limits typing and paste. In textarea, Shift+Enter inserts a newline and Enter applies the value.
- Enter/Escape return focus to the table; outside pointer interactions keep their natural focus destination. Arrow navigation between cells remains Phase 11.

Acceptance criteria:

- Opening an editor selects only the edited cell; applying it with Enter keeps that cell selected. Clicking outside the table interaction area clears selection after applying the current edit locally.
- Edited values are visible in the cell after edit mode closes.
- Pending edited cells have a clear changed state before save.
- Non-editable cells ignore double click, text input, and `Enter` editing commands.

## Phase 10: Pending Changes, Save, And Cancel

- [x] Move value, background, and note changes into one explicit pending changes model.
- [x] Add `Сохранить` and `Отмена` controls for local pending changes.
- [x] Show when the table has unsaved changes.
- [x] Make `Сохранить` send one changeset through the table data adapter.
- [x] Make `Отмена` discard all pending changes and restore the last loaded backend or mock state.
- [x] Keep changed-cell styling derived from pending changes, not from local input component state.

Implementation documents:

- [Design and agreed rules](docs/superpowers/specs/2026-09-09-phase10-pending-save-cancel-design.md).
- [Step-by-step implementation plan](docs/superpowers/plans/2026-09-09-phase10-pending-save-cancel.md).

Implementation note, 2026-09-09:

- Phase 10 is implemented with a source-agnostic table data adapter boundary, a mock adapter, one unified pending changes model for values/backgrounds/notes, and toolbar save/cancel states.
- `npm.cmd run build` and `npm.cmd run lint` pass. `git diff --check` is part of final verification for this phase.
- Manual browser smoke checks were run on `http://localhost:3001`: active text editor saves with one `Сохранить` click; saved value becomes the new loaded snapshot; background pending state appears and `Отмена` restores the loaded style; note add/save clears pending and keeps the note marker; select pending value saves; date clear pending value is discarded by `Отмена`.

Acceptance criteria:

- Background, note, and value changes are all counted as pending changes.
- Saving clears the pending state only after the adapter reports success.
- Cancel returns the visible table to the last loaded data.
- The toolbar communicates disabled, saving, success, and failure states clearly enough for manual verification.

## Phase 11: Keyboard Navigation

- [ ] Rework keyboard navigation around table cell selection instead of the old input-to-input focus behavior.
- [ ] Use a virtual coordinate map that understands `rowSpan` and `colSpan`.
- [ ] Move the active selected cell with arrow keys across the visual grid.
- [ ] Extend selection with `Shift + Arrow`.
- [ ] Skip duplicate coordinates that point to the same merged cell so navigation feels like Excel merged-cell movement.
- [ ] Keep readonly cells reachable by keyboard selection, but show locked selection styling when the cell cannot be edited, colored, or annotated.
- [ ] Make `Delete` clear values only for selected cells that are value-editable.

Acceptance criteria:

- Arrow navigation moves cell selection, not DOM focus between always-mounted inputs.
- Merged cells behave as one selectable cell during keyboard navigation.
- `Shift + Arrow` expands the range from the original anchor cell.
- Readonly cells remain navigable and visibly distinct.
- Action-only cells without value editors can still be selected normally.

## Phase 12: API Adapter

- [ ] Introduce a table data adapter boundary so UI code does not care whether data comes from mocks or the backend.
- [ ] Keep the current mocks as the first adapter implementation.
- [ ] Add adapter methods for loading table data, loading available background colors, and saving a pending changeset.
- [ ] Represent saves as explicit operations, such as value changes, background changes, and note changes.
- [ ] Keep backend identifiers static and passed through from data. Do not add runtime id generators for `techId`, `tech_id`, or replacement ids.

Acceptance criteria:

- Switching from mock data to backend data does not require rewriting selection, editing, or toolbar components.
- The save adapter receives only changed cells/actions, not a full rewritten table.
- API errors keep pending changes available for retry.

## Phase 13: Virtualization Research

- [ ] Move virtualization to the end of the roadmap until editing, selection, keyboard navigation, and save semantics are stable.
- [ ] Research whether native `<table>` rendering can support the required row virtualization with sticky headers, merged cells, context menus, and selection overlays.
- [ ] Compare native table virtualization with a CSS grid or positioned-cell layout if real backend tables are large enough to require it.
- [ ] Decide whether virtualization is needed based on realistic table sizes and measured browser performance.

Acceptance criteria:

- There is a written decision before implementation starts.
- The decision covers `rowSpan`, `colSpan`, sticky rows or headers, keyboard navigation, and selection rendering.
- If virtualization is deferred, the backlog records the table size/performance assumptions behind that decision.
