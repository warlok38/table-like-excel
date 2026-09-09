'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CellTable } from '@/types'
import { getCellKeysInRange, makeCellSelectionEntries } from '../helpers'

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
}

export function useTableSelection(data: CellTable[][]): TableSelectionState {
  const entries = useMemo(() => makeCellSelectionEntries(data), [data])
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

      const rangeKeys = getCellKeysInRange(entries, rangeAnchorKey, cellKey)
      setActiveCellKey(cellKey)
      setSelectedCellKeys(new Set(rangeKeys))
    },
    [entries, isDragging, rangeAnchorKey]
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
    extendRangeToCell
  }
}
