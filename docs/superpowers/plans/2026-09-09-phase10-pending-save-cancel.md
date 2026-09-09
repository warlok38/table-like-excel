# Phase 10 Pending Save Cancel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a source-agnostic pending changes layer with save and cancel controls for table values, backgrounds, and notes.

**Architecture:** Add a table adapter boundary that exposes loaded snapshots and save operations while the UI only works with table data, available colors, and pending changes. Replace separate value/background/note pending state with one helper-driven model, then route save/cancel through the adapter and toolbar states.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS modules, existing local mocks.

**Spec:** `docs/superpowers/specs/2026-09-09-phase10-pending-save-cancel-design.md`

## Global Constraints

- UI must not know whether table data comes from mocks or backend.
- Do not add automated tests, test frameworks, test scripts, test files, testing dependencies, or new runtime dependencies.
- Use `npm.cmd` instead of `npm` in PowerShell.
- Keep backend identifiers static and passed through from data.
- Preserve Phase 9 editor behavior unless this plan explicitly changes save/cancel behavior.
- Verification uses `npm.cmd run build`, `npm.cmd run lint`, `git diff --check`, and manual browser checks.

---

### Task 1: Pending Changes Contracts And Helpers

**Files:**
- Create: `src/components/table/pending/types.ts`
- Create: `src/components/table/pending/pending-changes.ts`
- Modify: `src/components/table/editing/types.ts`

**Interfaces:**
- Produces: `PendingChanges`, `emptyPendingChanges`, `hasPendingChanges`, `countPendingOperations`, `countPendingCells`, `setPendingValueChange`, `setPendingBackgroundChange`, `setPendingNoteChange`, `getPendingValue`, `getPendingBackground`, `getPendingNote`, `isValuePending`, `isBackgroundPending`, `isNotePending`.
- Consumes: `CellTable`, `CellValue`, `PendingChanges`.

- [ ] **Step 1: Add pending changes types**

Create `src/components/table/pending/types.ts`:

```ts
import type { CellValue } from '@/types'

export type PendingChanges = {
  values: Record<string, CellValue>
  backgrounds: Record<string, string | null>
  notes: Record<string, string | null>
}

export type PendingChangeSummary = {
  changedCells: number
  operations: number
  values: number
  backgrounds: number
  notes: number
}
```

- [ ] **Step 2: Add helper implementation**

Create `src/components/table/pending/pending-changes.ts` with own-property semantics and immutable updates. Import `getDataStatusBackground` from `../helpers/cell-style`.

```ts
import type { CellTable, CellValue } from '@/types'
import { getDataStatusBackground } from '../helpers/cell-style'
import type { PendingChanges, PendingChangeSummary } from './types'

export const emptyPendingChanges: PendingChanges = {
  values: {},
  backgrounds: {},
  notes: {}
}

export function hasOwnPending<T>(record: Record<string, T>, cellKey: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, cellKey)
}

export function hasPendingChanges(changes: PendingChanges): boolean {
  return (
    Object.keys(changes.values).length > 0 ||
    Object.keys(changes.backgrounds).length > 0 ||
    Object.keys(changes.notes).length > 0
  )
}

export function countPendingOperations(changes: PendingChanges): number {
  return (
    Object.keys(changes.values).length +
    Object.keys(changes.backgrounds).length +
    Object.keys(changes.notes).length
  )
}

export function countPendingCells(changes: PendingChanges): number {
  return new Set([
    ...Object.keys(changes.values),
    ...Object.keys(changes.backgrounds),
    ...Object.keys(changes.notes)
  ]).size
}

export function summarizePendingChanges(changes: PendingChanges): PendingChangeSummary {
  return {
    changedCells: countPendingCells(changes),
    operations: countPendingOperations(changes),
    values: Object.keys(changes.values).length,
    backgrounds: Object.keys(changes.backgrounds).length,
    notes: Object.keys(changes.notes).length
  }
}

export function getLoadedBackground(cell: CellTable): string | null {
  return getDataStatusBackground(cell) ?? cell.data.color ?? null
}

export function getLoadedNote(cell: CellTable): string | null {
  return cell.data_status?.note?.value ?? null
}

export function getPendingValue(changes: PendingChanges, cellKey: string): CellValue | undefined {
  return hasOwnPending(changes.values, cellKey) ? changes.values[cellKey] : undefined
}

export function getPendingBackground(
  changes: PendingChanges,
  cellKey: string
): string | null | undefined {
  return hasOwnPending(changes.backgrounds, cellKey) ? changes.backgrounds[cellKey] : undefined
}

export function getPendingNote(
  changes: PendingChanges,
  cellKey: string
): string | null | undefined {
  return hasOwnPending(changes.notes, cellKey) ? changes.notes[cellKey] : undefined
}

export function isValuePending(changes: PendingChanges, cellKey: string): boolean {
  return hasOwnPending(changes.values, cellKey)
}

export function isBackgroundPending(changes: PendingChanges, cellKey: string): boolean {
  return hasOwnPending(changes.backgrounds, cellKey)
}

export function isNotePending(changes: PendingChanges, cellKey: string): boolean {
  return hasOwnPending(changes.notes, cellKey)
}

export function setPendingValueChange(
  changes: PendingChanges,
  cellKey: string,
  loadedCell: CellTable,
  value: CellValue
): PendingChanges {
  const nextValues = { ...changes.values }
  if (value === loadedCell.value) {
    delete nextValues[cellKey]
  } else {
    nextValues[cellKey] = value
  }
  return { ...changes, values: nextValues }
}

export function setPendingBackgroundChange(
  changes: PendingChanges,
  cellKey: string,
  loadedCell: CellTable,
  background: string | null
): PendingChanges {
  const nextBackgrounds = { ...changes.backgrounds }
  if (background === getLoadedBackground(loadedCell)) {
    delete nextBackgrounds[cellKey]
  } else {
    nextBackgrounds[cellKey] = background
  }
  return { ...changes, backgrounds: nextBackgrounds }
}

export function setPendingNoteChange(
  changes: PendingChanges,
  cellKey: string,
  loadedCell: CellTable,
  note: string | null
): PendingChanges {
  const normalizedNote = note && note.length > 0 ? note : null
  const nextNotes = { ...changes.notes }
  if (normalizedNote === getLoadedNote(loadedCell)) {
    delete nextNotes[cellKey]
  } else {
    nextNotes[cellKey] = normalizedNote
  }
  return { ...changes, notes: nextNotes }
}
```

- [ ] **Step 3: Replace `PendingValues` alias**

Modify `src/components/table/editing/types.ts` so `PendingValues` is imported from the unified model or aliased from `PendingChanges['values']`:

```ts
import type { CellEditor, CellValue } from '@/types'
import type { PendingChanges } from '../pending/types'

export type EditableCellEditor = Exclude<CellEditor, { type: 'readonly' }>

export type PendingValues = PendingChanges['values']
```

- [ ] **Step 4: Verify type surface**

Run: `npm.cmd run build`

Expected: The build may still fail until later tasks wire imports, but no syntax errors should point to the new pending files.

---

### Task 2: Mock Table Data Adapter

**Files:**
- Create: `src/components/table/data-adapter/types.ts`
- Create: `src/components/table/data-adapter/mock-table-data-adapter.ts`
- Create: `src/components/table/data-adapter/use-table-data-adapter.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `TableDataAdapter`, `TableSaveChangeset`, `LoadedTableSnapshot`, `createMockTableDataAdapter`, `useTableDataAdapter`.
- Consumes: `PendingChanges`, `CellTable[][]`, `AvailableBackgroundColor[]`.

- [ ] **Step 1: Define adapter types**

Create `src/components/table/data-adapter/types.ts`:

```ts
import type { AvailableBackgroundColor, CellTable, CellValue } from '@/types'

export type TableValueChange = {
  cellKey: string
  value: CellValue
}

export type TableBackgroundChange = {
  cellKey: string
  background: string | null
}

export type TableNoteChange = {
  cellKey: string
  note: string | null
}

export type TableSaveChangeset = {
  values: TableValueChange[]
  backgrounds: TableBackgroundChange[]
  notes: TableNoteChange[]
}

export type LoadedTableSnapshot = {
  data: CellTable[][]
  availableBackgroundColors: AvailableBackgroundColor[]
}

export type TableDataAdapter = {
  load: () => Promise<LoadedTableSnapshot>
  saveChanges: (changeset: TableSaveChangeset) => Promise<LoadedTableSnapshot>
}
```

- [ ] **Step 2: Implement mock adapter**

Create `src/components/table/data-adapter/mock-table-data-adapter.ts`. Use existing mocks as constructor input, keep immutable updates, and apply saved operations by cell key.

Key implementation details:

```ts
import type { AvailableBackgroundColor, CellTable } from '@/types'
import { formatPendingValue } from '../editing/value-conversion'
import { makeCellKey } from '../helpers'
import type { LoadedTableSnapshot, TableDataAdapter, TableSaveChangeset } from './types'

type MockTableDataAdapterOptions = {
  data: CellTable[][]
  availableBackgroundColors: AvailableBackgroundColor[]
  saveDelayMs?: number
  failNextSave?: boolean
}

export function createMockTableDataAdapter({
  data,
  availableBackgroundColors,
  saveDelayMs = 300,
  failNextSave = false
}: MockTableDataAdapterOptions): TableDataAdapter {
  let snapshot: LoadedTableSnapshot = {
    data,
    availableBackgroundColors
  }
  let shouldFailNextSave = failNextSave

  return {
    async load() {
      return snapshot
    },
    async saveChanges(changeset) {
      await delay(saveDelayMs)
      if (shouldFailNextSave) {
        shouldFailNextSave = false
        throw new Error('Mock table save failed')
      }
      snapshot = {
        ...snapshot,
        data: applyChangeset(snapshot.data, changeset)
      }
      return snapshot
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function applyChangeset(data: CellTable[][], changeset: TableSaveChangeset): CellTable[][] {
  const values = new Map(changeset.values.map((change) => [change.cellKey, change.value] as const))
  const backgrounds = new Map(
    changeset.backgrounds.map((change) => [change.cellKey, change.background] as const)
  )
  const notes = new Map(changeset.notes.map((change) => [change.cellKey, change.note] as const))

  return data.map((row, rowIndex) =>
    row.map((cell, cellIndex) => {
      const cellKey = makeCellKey(cell, rowIndex, cellIndex)
      let nextCell = cell

      if (values.has(cellKey)) {
        const value = values.get(cellKey) ?? null
        const editor = nextCell.data.editor
        nextCell = {
          ...nextCell,
          value,
          formatted_value: editor && editor.type !== 'readonly' ? formatPendingValue(value, editor) : String(value ?? '')
        }
      }

      if (backgrounds.has(cellKey)) {
        nextCell = {
          ...nextCell,
          data: {
            ...nextCell.data,
            color: backgrounds.get(cellKey) ?? null
          }
        }
      }

      if (notes.has(cellKey)) {
        const note = notes.get(cellKey) ?? null
        nextCell = {
          ...nextCell,
          data_status: {
            ...(nextCell.data_status ?? {}),
            note: note && note.length > 0 ? { alias: 'Примечание', value: note } : null
          }
        }
      }

      return nextCell
    })
  )
}
```

- [ ] **Step 3: Add adapter hook**

Create `src/components/table/data-adapter/use-table-data-adapter.ts`:

```ts
'use client'

import { useEffect, useState } from 'react'
import type { LoadedTableSnapshot, TableDataAdapter } from './types'

type LoadState =
  | { status: 'loading'; snapshot: null; error: null }
  | { status: 'ready'; snapshot: LoadedTableSnapshot; error: null }
  | { status: 'error'; snapshot: null; error: string }

export function useTableDataAdapter(adapter: TableDataAdapter) {
  const [state, setState] = useState<LoadState>({ status: 'loading', snapshot: null, error: null })

  useEffect(() => {
    let isMounted = true
    setState({ status: 'loading', snapshot: null, error: null })
    adapter
      .load()
      .then((snapshot) => {
        if (isMounted) setState({ status: 'ready', snapshot, error: null })
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({
            status: 'error',
            snapshot: null,
            error: error instanceof Error ? error.message : 'Не удалось загрузить таблицу'
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [adapter])

  return state
}
```

- [ ] **Step 4: Route page through adapters**

Modify `src/app/page.tsx` by creating a small client demo component if needed, because hooks and adapter instances are client-side. Render two table demos through adapter-loaded snapshots instead of passing mocks directly to `Table`.

- [ ] **Step 5: Verify adapter loading**

Run: `npm.cmd run build`

Expected: Build passes or only reveals Task 3 wiring errors that are fixed there.

---

### Task 3: Wire Table To Unified Pending Changes

**Files:**
- Modify: `src/components/table/table.tsx`
- Modify: `src/components/table/hooks/use-table-editing.ts`
- Modify: `src/components/table/table-body.tsx`
- Modify: `src/components/table/table-cell.tsx`

**Interfaces:**
- Consumes: `PendingChanges` helpers from Task 1.
- Produces: Table behavior where values, backgrounds, and notes all read from and write to `pendingChanges`.

- [ ] **Step 1: Lift pending values out of `useTableEditing`**

Modify `useTableEditing` to accept:

```ts
type UseTableEditingOptions = {
  entries: CellSelectionEntry[]
  pendingValues: PendingValues
  onPendingValueChange: (cellKey: string, value: CellValue) => void
}
```

Remove `pendingValues` from the hook's internal state. Keep only `session` internally. Calls that previously used `writePendingValue` should call `onPendingValueChange`.

- [ ] **Step 2: Add unified pending state in `Table`**

In `src/components/table/table.tsx`, replace `manualBackgrounds`, `manualNotes`, and editing-owned `pendingValues` with:

```ts
const [pendingChanges, setPendingChanges] = useState<PendingChanges>(emptyPendingChanges)
```

Create callbacks:

```ts
const changePendingValue = useCallback((cellKey: string, value: CellValue) => {
  const entry = selectionEntries.find((item) => item.key === cellKey)
  if (!entry || !getCellCapabilities(entry.cell).canEditValue) return
  setPendingChanges((current) => setPendingValueChange(current, cellKey, entry.cell, value))
}, [selectionEntries])
```

Implement equivalent callbacks for background and note using Task 1 helpers and existing capability checks.

- [ ] **Step 3: Update note reads and writes**

Change `getNoteValue` to check `pendingChanges.notes`. Change `changeNote` and `deleteNote` to call `setPendingNoteChange`.

- [ ] **Step 4: Update background reads and writes**

Change `applyBackground` to call `setPendingBackgroundChange` for selected background-editable cells. Pass `pendingChanges.backgrounds` to body instead of `manualBackgrounds`.

- [ ] **Step 5: Update body display**

In `TableBody`, replace `pendingValues` prop with `pendingChanges`. Derive:

```ts
const hasPendingValue = isValuePending(pendingChanges, cellKey)
const pendingBackground = getPendingBackground(pendingChanges, cellKey)
const manualBackground = pendingBackground === undefined ? null : pendingBackground
const hasPendingBackground = isBackgroundPending(pendingChanges, cellKey)
const hasPendingNote = isNotePending(pendingChanges, cellKey)
```

Keep value display behavior from Phase 9, but source effective value from `pendingChanges.values`.

- [ ] **Step 6: Update cell changed styling**

In `TableCell`, rename or extend changed props so it can mark any pending dimension:

```ts
isValueChanged={hasPendingValue}
isCellChanged={hasPendingValue || hasPendingBackground || hasPendingNote}
```

Keep the existing yellow value marker for value changes. Add a subtle class for any pending cell if useful, but do not obscure selection, background, or note markers.

- [ ] **Step 7: Verify Phase 9 behavior**

Run: `npm.cmd run build`

Expected: Build passes. Manual browser spot-check after Task 5 will cover behavior.

---

### Task 4: Save And Cancel Controls

**Files:**
- Modify: `src/components/table/table.tsx`
- Modify: `src/components/table/table-toolbar.tsx`
- Modify: `src/components/table/table.module.css`

**Interfaces:**
- Consumes: `TableDataAdapter`, `PendingChanges`, `TableSaveChangeset`.
- Produces: `Сохранить`, `Отмена`, disabled/saving/success/failure toolbar states.

- [ ] **Step 1: Extend Table props**

Add required save prop to `Table`:

```ts
type TableProps = {
  data: CellTable[][]
  availableBackgroundColors?: AvailableBackgroundColor[]
  onSaveChanges: (changeset: TableSaveChangeset) => Promise<CellTable[][]>
}
```

The page adapter layer passes a save callback that calls `adapter.saveChanges`, writes the returned snapshot into page-level loaded state, and returns the saved `CellTable[][]` to `Table`.

- [ ] **Step 2: Build changeset helper**

Add a local helper in `table.tsx` or a focused file if `table.tsx` gets too large:

```ts
function toSaveChangeset(changes: PendingChanges): TableSaveChangeset {
  return {
    values: Object.entries(changes.values).map(([cellKey, value]) => ({ cellKey, value })),
    backgrounds: Object.entries(changes.backgrounds).map(([cellKey, background]) => ({
      cellKey,
      background
    })),
    notes: Object.entries(changes.notes).map(([cellKey, note]) => ({ cellKey, note }))
  }
}
```

- [ ] **Step 3: Add save status state**

In `Table`, add:

```ts
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'failure'>('idle')
const [saveMessage, setSaveMessage] = useState<string | null>(null)
```

Clear success/failure message when a new pending mutation happens.

- [ ] **Step 4: Implement save**

`handleSave` commits active editor, exits open popups if needed, sends the full changeset, and clears pending only after success. On failure, keep pending unchanged.

- [ ] **Step 5: Implement cancel**

`handleCancel` cancels or closes active editor, clears `pendingChanges`, closes note/context UI, and leaves selection intact.

- [ ] **Step 6: Extend toolbar UI**

Add props:

```ts
pendingSummary: PendingChangeSummary
saveStatus: 'idle' | 'saving' | 'success' | 'failure'
saveMessage: string | null
onSave: () => void
onCancel: () => void
```

Render `Сохранить` and `Отмена` as buttons. Disable save/cancel when there are no pending changes or `saveStatus === 'saving'`. Disable background palette while saving.

- [ ] **Step 7: Add CSS**

Add compact styles for pending summary, save buttons, saving state, success text, and failure text to `table.module.css`. Keep the toolbar dense and table-like.

- [ ] **Step 8: Verify save/cancel UI compiles**

Run: `npm.cmd run build`

Expected: Build passes after adapter page wiring is complete.

---

### Task 5: Page Adapter Wiring And Manual Verification

**Files:**
- Modify: `src/app/page.tsx`
- Optional Create: `src/app/table-demo-client.tsx`
- Modify: `BACKLOG.md`

**Interfaces:**
- Consumes: `createMockTableDataAdapter`, `useTableDataAdapter`, `Table`.
- Produces: Running demo with adapter-loaded data and Phase 10 backlog marked complete.

- [ ] **Step 1: Create client demo wrapper**

If `page.tsx` remains a server component, create `src/app/table-demo-client.tsx` with `'use client'`. Use `useMemo` to create adapters:

```ts
const primaryAdapter = useMemo(
  () =>
    createMockTableDataAdapter({
      data: tableDataMock,
      availableBackgroundColors: availableBackgroundColorsMock
    }),
  []
)
```

Use `useTableDataAdapter` to load each adapter and pass loaded snapshot to `Table`.

- [ ] **Step 2: Wire save response into loaded snapshot**

When `Table` calls save and the adapter returns a snapshot, update the hook/page state so `Table` receives the saved data as its new loaded snapshot. Pending changes in `Table` clear after this succeeds.

- [ ] **Step 3: Update page copy**

Update the explanatory text for Phase 10 to mention unsaved changes, save, and cancel.

- [ ] **Step 4: Update backlog**

Mark Phase 10 checklist items complete and add an implementation note with the exact verification commands that pass and manual scenarios checked.

- [ ] **Step 5: Run final verification**

Run:

```powershell
npm.cmd run build
npm.cmd run lint
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Manual browser checks**

Start dev server:

```powershell
npm.cmd run dev
```

Use the browser to verify:

- value edit increments pending summary and value marker;
- background change increments pending summary and visible background;
- note add/edit/delete increments pending summary and marker;
- save shows saving, then success, clears pending, and keeps saved visible state;
- cancel discards all pending dimensions and restores last loaded snapshot;
- selection and Phase 9 editor behavior still work for Enter, double click, Esc, outside click, select, and date editors.

- [ ] **Step 7: Final diff review**

Run:

```powershell
git status --short
git diff -- src/components/table src/app BACKLOG.md docs/superpowers
```

Expected: diff only includes Phase 10 docs and implementation changes.
