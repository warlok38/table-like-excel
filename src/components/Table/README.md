# Table Component

Public import:

```ts
import { Table, getTableCellKey, type TableSaveChangeset } from '@/components/Table'
```

## Props

```ts
type TableProps = {
  data: CellTable[][]
  availableBackgroundColors?: AvailableBackgroundColor[]
  cellManagementEnabled: boolean
  onSaveChanges: (changeset: TableSaveChangeset) => Promise<CellTable[][]>
}
```

`cellManagementEnabled` is supplied by the integration layer. The current demo computes it as
`data.some(row => row.some(cell => cell.data_status !== null && cell.data_status !== undefined))`.

`onSaveChanges` receives only changed values, backgrounds and notes. It must return the confirmed
table snapshot; the table accepts that snapshot as its new local base even when the caller does not
refresh React props.

## Save And Cancel

The table owns confirmed base data plus local pending changes. `Сохранить` commits any open editor,
closes table portals, sends one changeset and blocks table mutations while the promise is pending.
Scroll and normal page focus remain available. `Отмена` is local and returns the visible data to the
last confirmed base without calling `onSaveChanges`.

On save failure, pending changes and changed-cell markers remain available for retry. On success, the
returned snapshot becomes the new base and pending changes are cleared.

## Integration Boundary

The core table changeset uses only `{ cellKey, row, col }` targets. Backend identifiers belong outside
the component; `src/integrations/table/backend-target.ts` shows how to attach the legacy static
identifiers with `getTableCellKey`.

The integration must provide stable unique cell keys for the same table structure. Incoming prop data
is accepted only while the table has no local pending changes, no open editor and no active save. For a
different independent dataset, mount the table with a different React `key`.

## Dependencies

The component uses React, react-dom (portals), classnames and CSS Modules. It does not import Next.js, app code, mocks,
Redux or backend adapters.

## Ownership

- `Table.tsx` composes the controller with the toolbar, grid and context menu exported by `ui/index.ts`.
- `model/index.ts` and `lib/index.ts` are internal segment facades; the root `index.ts` remains the only public API.
- `model/data` owns confirmed data, the current cell index and stable key/span topology. Navigation never caches old cell data.
- `model/changes` owns pending batches, value/background commands and loaded background precedence.
- `model/editing` owns draft sessions, normalization and shared date validity; calendar grid construction stays with `ui/CellValueEditor`.
- `model/selection` owns ranges, keyboard coordinates and navigation; `model/notes` owns note/menu state and commands.
- `model/save` owns changeset serialization, the shared synchronous lock and async lifecycle. The controller coordinates these commands; keyboard branches have their own hook.
- Grid, cells, toolbar, menu and selection own their CSS. Cell styles/contrast, content measurement and outline geometry stay beside their UI.

The management flag disables selection/navigation and background/note actions, but does not disable value editors permitted by cell metadata. An active save blocks all mutation commands without dimming; wheel and Tab remain available. New local edits clear stale save messages. Save lifecycle guards tolerate Strict Mode and ignore completion from an unmounted lifecycle.

The incoming-prop observation ref is separate from accepted save data. An unchanged prop reference cannot undo the returned snapshot. Consumers must not replace the dataset during local work; conflict merging, deferred external updates and virtualization are out of scope.

## Performance boundaries

Cell callbacks stay stable across draft changes; only the active memoized Cell renders. Grid mapping still traverses all cells. Structure identity survives a value-only save. Outline paths are cached by selection and geometry version; coordinate and interval indexes avoid a global all-pairs edge scan. Fractional intersections retain the 0.1 tolerance per pair. Pathological overlapping geometry can still have many candidates.

Resize/font changes refresh geometry; ordinary scrolling does not remeasure every cell. The sticky first row is refreshed separately because its relative position changes on scroll. Portalled editor positioning retains its own scroll listeners.
