# Table Component

Public import:

```ts
import { Table, getTableCellKey, type TableSaveChangeset } from '@/components/table'
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

The component uses React and existing CSS Modules only. It does not import Next.js, app code, mocks,
Redux or backend adapters.
