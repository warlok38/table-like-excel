# Phase 10: pending changes, save, and cancel

Статус: продуктовые решения согласованы 2026-09-09. UI не должен знать, работает он с моками или backend; различие живёт за adapter boundary.

## Граница фазы

Phase 10 объединяет локальные изменения значений, заливок и примечаний в один явный pending changes model, добавляет `Сохранить` и `Отмена`, состояние сохранения и mock adapter. Phase 12 сможет заменить mock adapter на backend implementation без переписывания table UI.

Не входит в Phase 10: реальный backend HTTP adapter, keyboard navigation, Delete для массовой очистки, clipboard ranges, virtualization, автоматические тесты и новые зависимости.

## Adapter boundary

UI получает последнюю загруженную таблицу, доступные цвета и операции через table data adapter. Компоненты таблицы не импортируют mock data напрямую и не ветвятся по источнику данных.

Начальная реализация adapter:

- Загружает `CellTable[][]` из существующих mock modules.
- Загружает `AvailableBackgroundColor[]` из существующего mock module.
- Принимает один changeset на save.
- Имитирует асинхронный save.
- Возвращает новый loaded snapshot, в который применены сохранённые changes.

Snapshot после успешного save становится новой базой. Pending state очищается только после successful adapter response. Последующая `Отмена` возвращает вид к этой новой базе, а не к исходным мокам до save.

## Pending changes model

Единая модель хранит только отличия от текущего loaded snapshot:

- `values: Record<string, CellValue>`
- `backgrounds: Record<string, string | null>`
- `notes: Record<string, string | null>`

Семантика own-property обязательна. Отсутствие ключа означает “используй loaded snapshot”. Присутствующий `null` означает явную очистку значения, заливки или примечания.

При записи изменения helper сравнивает новое значение с loaded snapshot. Если они равны, соответствующий pending key удаляется. Для заливки сравнение идёт с effective loaded background по существующему правилу: manual background overrides data status, data status overrides cell base color. Для примечаний сравнение идёт с `cell.data_status?.note?.value ?? null`.

## UI state and behavior

Toolbar показывает selection controls и pending controls в одном месте:

- Количество выбранных ячеек и доступных для заливки остаётся.
- Если есть pending changes, отображается unsaved summary.
- `Сохранить` активна только когда есть pending changes и save не выполняется.
- `Отмена` активна только когда есть pending changes и save не выполняется.
- Во время save toolbar показывает saving state and disables mutating controls that would collide with the in-flight save.
- После success toolbar кратко показывает success state.
- После failure toolbar показывает failure state and keeps pending changes available for retry.

`Отмена` закрывает активный value editor, context menu and note editor, очищает pending changes and returns visible cells to loaded snapshot. Selection may remain; visible data must be restored.

`Сохранить` first commits any active value editor, then sends the complete pending changeset through the adapter. Pending state clears only if adapter resolves successfully. If save fails, the edited values, backgrounds, notes and changed markers remain visible.

## Rendering rules

All changed-cell styling is derived from pending changes:

- Value marker is based on `pendingChanges.values`.
- Background display uses `pendingChanges.backgrounds` before loaded snapshot colors.
- Note marker/value uses `pendingChanges.notes` before loaded snapshot note.
- A cell can have multiple pending dimensions; summary counts both changed cells and changed operations.

Existing Phase 9 editor rules remain unchanged. Esc inside an editor still restores the pending state from before that editor session; global `Отмена` discards all pending changes.

## Save changeset

The adapter receives only changed actions, not a full rewritten table. Each operation keeps the stable cell key and the new value:

- value operation: `{ cellKey, value }`
- background operation: `{ cellKey, background }`
- note operation: `{ cellKey, note }`

The mock adapter applies operations by producing a new immutable table snapshot. It updates:

- `cell.value` and `cell.formatted_value` for value operations using the same editor-aware formatting rules the UI uses for pending display.
- `cell.data.color` for background operations. A `null` background clears the base cell color. DataStatus background remains part of loaded metadata; pending/manual background still has priority before save, and saved mock data uses `data.color` for the local demo baseline.
- `cell.data_status.note` for note operations. A `null` or empty note removes the note; a non-empty note sets alias/value with a local alias.

## Verification

No automated tests are added by project rule. Verification for this phase:

- `npm.cmd run build`
- `npm.cmd run lint`
- `git diff --check`
- Manual browser checks:
  - value edit increments pending summary and value marker;
  - background change increments pending summary and visible background;
  - note add/edit/delete increments pending summary and marker;
  - save shows saving, then success, clears pending, and keeps saved visible state;
  - cancel discards all pending dimensions and restores last loaded snapshot;
  - save failure, if triggered through the mock failure path, keeps pending changes.
