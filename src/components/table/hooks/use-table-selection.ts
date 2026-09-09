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

export type TableSelectionState = {
  activeCellKey: string | null
  selectedCellKeys: Set<string>
  isDragging: boolean
  selectCell: (cellKey: string, options: SelectCellOptions) => void
  selectOnly: (cellKey: string) => void
  clearSelection: () => void
  extendRangeToCell: (cellKey: string) => void
  moveActiveCell: (direction: KeyboardDirection) => void
  extendActiveRange: (direction: KeyboardDirection) => void
}

export function useTableSelection(data: CellTable[][]): TableSelectionState {
  const virtualMap = useMemo(() => makeVirtualTableMap(data), [data])
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null)
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(() => new Set())
  const [rangeAnchorKey, setRangeAnchorKey] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const selectCell = useCallback((cellKey: string, { append }: SelectCellOptions) => {
    setActiveCellKey(cellKey)
    setRangeAnchorKey(cellKey)

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
  }, [])

  const selectOnly = useCallback((cellKey: string) => {
    setActiveCellKey(cellKey)
    setRangeAnchorKey(cellKey)
    setSelectedCellKeys(new Set([cellKey]))
    setIsDragging(false)
  }, [])

  const clearSelection = useCallback(() => {
    setActiveCellKey(null)
    setRangeAnchorKey(null)
    setSelectedCellKeys(new Set())
    setIsDragging(false)
  }, [])

  const extendRangeToCell = useCallback(
    (cellKey: string) => {
      if (!isDragging || !rangeAnchorKey) {
        return
      }

      const rangeKeys = getCellKeysInVirtualRange(virtualMap, rangeAnchorKey, cellKey)
      setActiveCellKey(cellKey)
      setSelectedCellKeys(new Set(rangeKeys))
    },
    [isDragging, rangeAnchorKey, virtualMap]
  )

  const moveActiveCell = useCallback(
    (direction: KeyboardDirection) => {
      if (!activeCellKey) return

      const nextKey = getNextCellKey(virtualMap, activeCellKey, direction)
      if (nextKey === activeCellKey) return

      setActiveCellKey(nextKey)
      setRangeAnchorKey(nextKey)
      setSelectedCellKeys(new Set([nextKey]))
      setIsDragging(false)
    },
    [activeCellKey, virtualMap]
  )

  const extendActiveRange = useCallback(
    (direction: KeyboardDirection) => {
      if (!activeCellKey) return

      const nextKey = getNextCellKey(virtualMap, activeCellKey, direction)
      const anchorKey = rangeAnchorKey ?? activeCellKey
      const rangeKeys = getCellKeysInVirtualRange(virtualMap, anchorKey, nextKey)

      setActiveCellKey(nextKey)
      setRangeAnchorKey(anchorKey)
      setSelectedCellKeys(new Set(rangeKeys))
      setIsDragging(false)
    },
    [activeCellKey, rangeAnchorKey, virtualMap]
  )

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
