# Project Instructions

## Testing

- Do not write automated tests for this project.
- Do not add test frameworks, test scripts, test files, or testing dependencies.
- Verification should be done through `npm.cmd run build`, lint/type checks when available, and manual browser checks.

## Windows And Encoding

- Use `npm.cmd` instead of `npm` in PowerShell.
- Read text files with UTF-8 encoding when using PowerShell, for example `Get-Content -Encoding UTF8`.
- When writing files from PowerShell, specify UTF-8 encoding.
- Prefer `rg` for searching files and text.

## Table Refactor Scope

- The imported table should become a standalone local component.
- Remove dependencies on the source project instead of recreating the whole old app architecture.
- Keep cell value editing out of the first implementation pass.
- Use local mocks to imitate backend responses for table data, `DataStatus`, notes, and available background colors.
- Keep static replacement identifiers as static values. Do not add runtime generator functions for `techId`, `tech_id`, or id replacements.

## Architecture Preferences

- Prefer small focused files with one clear responsibility.
- Keep rendering components mostly presentational.
- Put table state transitions such as selection, background updates, and note updates behind explicit helpers or hooks.
- Avoid broad abstractions until the repeated shape is clear.
- Do not introduce Redux for the current table feature.

## UI Behavior

- The table should prioritize Excel-like interactions: single-cell selection, drag selection, `Ctrl + click` multi-selection, selected-cell background changes, and right-click note actions.
- Background color options should come from mocked backend data, not hardcoded JSX controls.
- Notes should be visible through a subtle marker on the cell and editable through table UI.
