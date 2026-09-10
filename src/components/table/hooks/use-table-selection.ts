'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CellTable } from '@/types'
import {
  getCellKeysInVirtualRange,
  getNextCellKey,
  makeVirtualTableMap,
  type KeyboardDirection
} from '../helpers'

type SelectCellOptions = {
  append: boolean
}

type UseTableSelectionOptions = {
  isEnabled?: boolean
}

export type TableSelectionState = {
  activeCellKey: string | null
  selectedCellKeys: Set<string>
  isDragging: boolean
  selectCell: (cellKey: string, options: SelectCellOptions) => void
  selectOnly: (cellKey: string) => boolean
  clearSelection: () => void
  extendRangeToCell: (cellKey: string) => void
  moveActiveCell: (direction: KeyboardDirection) => void
  extendActiveRange: (direction: KeyboardDirection) => void
}

export function useTableSelection(
  data: CellTable[][],
  { isEnabled = true }: UseTableSelectionOptions = {}
): TableSelectionState {
  const virtualMap = useMemo(() => makeVirtualTableMap(data), [data])
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null)
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(() => new Set())
  const [rangeAnchorKey, setRangeAnchorKey] = useState<string | null>(null)
  const [rangeFocusKey, setRangeFocusKey] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const selectCell = useCallback(
    (cellKey: string, { append }: SelectCellOptions) => {
      if (!isEnabled) return

      setActiveCellKey(cellKey)
      setRangeAnchorKey(cellKey)
      setRangeFocusKey(cellKey)

      if (append) {
        setIsDragging(false)
        setSelectedCellKeys((currentKeys) => {
          const nextKeys = new Set(currentKeys)

          if (nextKeys.has(cellKey)) {
            nextKeys.delete(cellKey)
          } else {
            nextKeys.add(cellKey)
          }

          return nextKeys
        })
        return
      }

      setIsDragging(true)
      setSelectedCellKeys(new Set([cellKey]))
    },
    [isEnabled]
  )

  const selectOnly = useCallback(
    (cellKey: string) => {
      if (!isEnabled) return false

      setActiveCellKey(cellKey)
      setRangeAnchorKey(cellKey)
      setRangeFocusKey(cellKey)
      setSelectedCellKeys(new Set([cellKey]))
      setIsDragging(false)
      return true
    },
    [isEnabled]
  )

  const clearSelection = useCallback(() => {
    setActiveCellKey(null)
    setRangeAnchorKey(null)
    setRangeFocusKey(null)
    setSelectedCellKeys(new Set())
    setIsDragging(false)
  }, [])

  const extendRangeToCell = useCallback(
    (cellKey: string) => {
      if (!isDragging || !rangeAnchorKey) {
        return
      }

      if (!isEnabled) return

      const rangeKeys = getCellKeysInVirtualRange(virtualMap, rangeAnchorKey, cellKey)
      setActiveCellKey(rangeAnchorKey)
      setRangeFocusKey(cellKey)
      setSelectedCellKeys(new Set(rangeKeys))
    },
    [isDragging, isEnabled, rangeAnchorKey, virtualMap]
  )

  const moveActiveCell = useCallback(
    (direction: KeyboardDirection) => {
      if (!activeCellKey) return

      if (!isEnabled) return

      const nextKey = getNextCellKey(virtualMap, activeCellKey, direction)
      if (nextKey === activeCellKey) return

      setActiveCellKey(nextKey)
      setRangeAnchorKey(nextKey)
      setRangeFocusKey(nextKey)
      setSelectedCellKeys(new Set([nextKey]))
      setIsDragging(false)
    },
    [activeCellKey, isEnabled, virtualMap]
  )

  const extendActiveRange = useCallback(
    (direction: KeyboardDirection) => {
      if (!activeCellKey) return

      if (!isEnabled) return

      const focusKey = rangeFocusKey ?? activeCellKey
      const nextKey = getNextCellKey(virtualMap, focusKey, direction)
      const anchorKey = rangeAnchorKey ?? activeCellKey
      const rangeKeys = getCellKeysInVirtualRange(virtualMap, anchorKey, nextKey)

      setActiveCellKey(anchorKey)
      setRangeAnchorKey(anchorKey)
      setRangeFocusKey(nextKey)
      setSelectedCellKeys(new Set(rangeKeys))
      setIsDragging(false)
    },
    [activeCellKey, isEnabled, rangeAnchorKey, rangeFocusKey, virtualMap]
  )

  useEffect(() => {
    if (isEnabled) return

    clearSelection()
  }, [clearSelection, isEnabled])

  useEffect(() => {
    if (!isDragging) {
      return
    }

    const stopDragging = () => setIsDragging(false)

    window.addEventListener('mouseup', stopDragging)
    return () => window.removeEventListener('mouseup', stopDragging)
  }, [isDragging])

  return {
    activeCellKey,
    selectedCellKeys,
    isDragging,
    selectCell,
    selectOnly,
    clearSelection,
    extendRangeToCell,
    moveActiveCell,
    extendActiveRange
  }
}
