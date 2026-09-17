'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'

import type { TableStructure } from '../data/tableStructure'
import {
  getCellKeysInVirtualRange,
  getNextCellKey,
  getNextLinearCellKey,
  makeVirtualTableMap,
  type KeyboardDirection,
  type LinearDirection
} from './virtualTable'

type SelectCellOptions = {
  append: boolean
}

type UseTableSelectionOptions = {
  isEnabled?: boolean
  isBlockedRef?: MutableRefObject<boolean>
}

type DragSelection = {
  append: boolean
  baseKeys: Set<string>
}

export type TableSelectionState = {
  activeCellKey: string | null
  selectedCellKeys: Set<string>
  isDragging: boolean
  selectCell: (cellKey: string, options: SelectCellOptions) => void
  selectOnly: (cellKey: string) => boolean
  clearSelection: () => void
  stopDragging: () => void
  extendRangeToCell: (cellKey: string) => void
  moveActiveCell: (direction: KeyboardDirection) => void
  moveActiveCellLinear: (direction: LinearDirection) => boolean
  selectBoundaryCell: (direction: LinearDirection) => boolean
  extendActiveRange: (direction: KeyboardDirection) => void
}

export function useTableSelection(
  structure: TableStructure,
  { isEnabled = true, isBlockedRef }: UseTableSelectionOptions = {}
): TableSelectionState {
  const virtualMap = useMemo(() => makeVirtualTableMap(structure.rows), [structure])
  const linearCellKeys = useMemo(
    () => structure.rows.flatMap((row) => row.map((cell) => cell.key)),
    [structure]
  )
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null)
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(() => new Set())
  const [rangeAnchorKey, setRangeAnchorKey] = useState<string | null>(null)
  const [rangeFocusKey, setRangeFocusKey] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const selectedCellKeysRef = useRef(selectedCellKeys)
  const dragSelectionRef = useRef<DragSelection | null>(null)

  selectedCellKeysRef.current = selectedCellKeys

  const selectCell = useCallback(
    (cellKey: string, { append }: SelectCellOptions) => {
      if (!isEnabled) return
      if (isBlockedRef?.current) return

      setActiveCellKey(cellKey)
      setRangeAnchorKey(cellKey)
      setRangeFocusKey(cellKey)

      if (append) {
        const baseKeys = new Set(selectedCellKeysRef.current)
        const nextKeys = new Set(baseKeys)

        if (nextKeys.has(cellKey)) {
          nextKeys.delete(cellKey)
        } else {
          nextKeys.add(cellKey)
        }

        dragSelectionRef.current = { append: true, baseKeys }
        setIsDragging(true)
        setSelectedCellKeys(nextKeys)
        return
      }

      dragSelectionRef.current = { append: false, baseKeys: new Set() }
      setIsDragging(true)
      setSelectedCellKeys(new Set([cellKey]))
    },
    [isBlockedRef, isEnabled]
  )

  const selectOnly = useCallback(
    (cellKey: string) => {
      if (!isEnabled) return false
      if (isBlockedRef?.current) return false

      setActiveCellKey(cellKey)
      setRangeAnchorKey(cellKey)
      setRangeFocusKey(cellKey)
      setSelectedCellKeys(new Set([cellKey]))
      dragSelectionRef.current = null
      setIsDragging(false)
      return true
    },
    [isBlockedRef, isEnabled]
  )

  const clearSelection = useCallback(() => {
    if (isBlockedRef?.current) return

    setActiveCellKey(null)
    setRangeAnchorKey(null)
    setRangeFocusKey(null)
    setSelectedCellKeys(new Set())
    dragSelectionRef.current = null
    setIsDragging(false)
  }, [isBlockedRef])

  const stopDragging = useCallback(() => {
    dragSelectionRef.current = null
    setIsDragging(false)
  }, [])

  const extendRangeToCell = useCallback(
    (cellKey: string) => {
      if (!isDragging || !rangeAnchorKey) {
        return
      }

      if (!isEnabled) return
      if (isBlockedRef?.current) return

      const rangeKeys = getCellKeysInVirtualRange(virtualMap, rangeAnchorKey, cellKey)
      const dragSelection = dragSelectionRef.current
      const nextKeys = dragSelection?.append ? new Set(dragSelection.baseKeys) : rangeKeys

      if (dragSelection?.append) {
        rangeKeys.forEach((key) => nextKeys.add(key))
      }

      setActiveCellKey(rangeAnchorKey)
      setRangeFocusKey(cellKey)
      setSelectedCellKeys(nextKeys)
    },
    [isBlockedRef, isDragging, isEnabled, rangeAnchorKey, virtualMap]
  )

  const moveActiveCell = useCallback(
    (direction: KeyboardDirection) => {
      if (!activeCellKey) return

      if (!isEnabled) return
      if (isBlockedRef?.current) return

      const nextKey = getNextCellKey(virtualMap, activeCellKey, direction)
      if (nextKey === activeCellKey) return

      setActiveCellKey(nextKey)
      setRangeAnchorKey(nextKey)
      setRangeFocusKey(nextKey)
      setSelectedCellKeys(new Set([nextKey]))
      dragSelectionRef.current = null
      setIsDragging(false)
    },
    [activeCellKey, isBlockedRef, isEnabled, virtualMap]
  )

  const moveActiveCellLinear = useCallback(
    (direction: LinearDirection) => {
      if (!activeCellKey || !isEnabled || isBlockedRef?.current) return false

      const nextKey = getNextLinearCellKey(linearCellKeys, activeCellKey, direction)
      if (!nextKey) return false

      setActiveCellKey(nextKey)
      setRangeAnchorKey(nextKey)
      setRangeFocusKey(nextKey)
      setSelectedCellKeys(new Set([nextKey]))
      dragSelectionRef.current = null
      setIsDragging(false)
      return true
    },
    [activeCellKey, isBlockedRef, isEnabled, linearCellKeys]
  )

  const selectBoundaryCell = useCallback(
    (direction: LinearDirection) => {
      if (!isEnabled || isBlockedRef?.current || linearCellKeys.length === 0) return false

      const boundaryKey =
        direction === 'forward' ? linearCellKeys[0] : linearCellKeys[linearCellKeys.length - 1]
      setActiveCellKey(boundaryKey)
      setRangeAnchorKey(boundaryKey)
      setRangeFocusKey(boundaryKey)
      setSelectedCellKeys(new Set([boundaryKey]))
      dragSelectionRef.current = null
      setIsDragging(false)
      return true
    },
    [isBlockedRef, isEnabled, linearCellKeys]
  )

  const extendActiveRange = useCallback(
    (direction: KeyboardDirection) => {
      if (!activeCellKey) return

      if (!isEnabled) return
      if (isBlockedRef?.current) return

      const focusKey = rangeFocusKey ?? activeCellKey
      const nextKey = getNextCellKey(virtualMap, focusKey, direction)
      const anchorKey = rangeAnchorKey ?? activeCellKey
      const rangeKeys = getCellKeysInVirtualRange(virtualMap, anchorKey, nextKey)

      setActiveCellKey(anchorKey)
      setRangeAnchorKey(anchorKey)
      setRangeFocusKey(nextKey)
      setSelectedCellKeys(rangeKeys)
      dragSelectionRef.current = null
      setIsDragging(false)
    },
    [activeCellKey, isBlockedRef, isEnabled, rangeAnchorKey, rangeFocusKey, virtualMap]
  )

  useEffect(() => {
    if (isEnabled) return

    clearSelection()
  }, [clearSelection, isEnabled])

  useEffect(() => {
    if (!isDragging) {
      return
    }

    window.addEventListener('mouseup', stopDragging)
    return () => window.removeEventListener('mouseup', stopDragging)
  }, [isDragging, stopDragging])

  return {
    activeCellKey,
    selectedCellKeys,
    isDragging,
    selectCell,
    selectOnly,
    clearSelection,
    stopDragging,
    extendRangeToCell,
    moveActiveCell,
    moveActiveCellLinear,
    selectBoundaryCell,
    extendActiveRange
  }
}
