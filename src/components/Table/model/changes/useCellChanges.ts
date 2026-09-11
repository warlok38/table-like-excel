import { useCallback, useMemo, type MutableRefObject } from 'react'
import type { CellValue } from '../table'
import type { TableCellEntry } from '../data/tableIndex'
import { getCellCapabilities } from '../cellCapabilities'
import type { useTableChanges } from './useTableChanges'
import {
  setPendingBackgroundChanges,
  setPendingValueChange,
  setPendingValueChanges
} from './pendingChanges'

type Options = {
  entriesByKey: Map<string, TableCellEntry>
  selectedCellKeys: Set<string>
  cellManagementEnabled: boolean
  isBlockedRef: MutableRefObject<boolean>
  updatePending: ReturnType<typeof useTableChanges>['updatePending']
}

export function useCellChanges({
  entriesByKey,
  selectedCellKeys,
  cellManagementEnabled,
  isBlockedRef,
  updatePending
}: Options) {
  const selectedEntries = useMemo(
    () =>
      Array.from(selectedCellKeys).flatMap((key) => {
        const entry = entriesByKey.get(key)
        return entry ? [entry] : []
      }),
    [entriesByKey, selectedCellKeys]
  )
  const backgroundEntries = useMemo(
    () =>
      selectedEntries.filter(
        (entry) =>
          getCellCapabilities(entry.cell, { dataStatusActionsEnabled: cellManagementEnabled })
            .canChangeBackground
      ),
    [cellManagementEnabled, selectedEntries]
  )
  const changeValue = useCallback(
    (key: string, value: CellValue) => {
      if (isBlockedRef.current) return
      const entry = entriesByKey.get(key)
      if (!entry || !getCellCapabilities(entry.cell).canEditValue) return
      updatePending((current) => setPendingValueChange(current, key, entry.cell, value))
    },
    [entriesByKey, isBlockedRef, updatePending]
  )
  const changeBackground = useCallback(
    (background: string | null) => {
      if (isBlockedRef.current || !cellManagementEnabled) return
      updatePending((current) =>
        setPendingBackgroundChanges(current, backgroundEntries, background)
      )
    },
    [backgroundEntries, cellManagementEnabled, isBlockedRef, updatePending]
  )
  const clearSelectedValues = useCallback(() => {
    if (isBlockedRef.current || !cellManagementEnabled) return
    updatePending((current) =>
      setPendingValueChanges(
        current,
        selectedEntries.filter((entry) => getCellCapabilities(entry.cell).canEditValue),
        null
      )
    )
  }, [cellManagementEnabled, isBlockedRef, selectedEntries, updatePending])
  return {
    changeValue,
    changeBackground,
    clearSelectedValues,
    backgroundEditableSelectedCount: backgroundEntries.length
  }
}
