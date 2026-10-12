'use client'

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
  type RefObject
} from 'react'

import type { TableStructure } from '../../model'
import { makeTableLayoutModel, measureTableLayout, type TableLayoutSnapshot } from './tableLayout'
import {
  measureTableColumns,
  updateTableColumnWidths,
  type TableCellContent,
  type TableColumnMeasurements
} from './tableColumnLayout'
import { measureChangedOffscreenRows } from './tableOffscreenRows'
import {
  captureTableScrollAnchor,
  resolveTableScrollAnchor,
  updateTableRowHeights,
  type TableScrollAnchor
} from './tableRowLayout'

export function useTableLayout(
  tableRef: RefObject<HTMLTableElement>,
  surfaceRef: RefObject<HTMLDivElement>,
  viewportRef: RefObject<HTMLDivElement>,
  structure: TableStructure,
  cellContents: ReadonlyMap<string, TableCellContent>
) {
  const model = useMemo(() => makeTableLayoutModel(structure), [structure])
  const [snapshot, setSnapshot] = useState<TableLayoutSnapshot | null>(null)
  const [isRemeasuring, setIsRemeasuring] = useState(false)
  const currentSnapshot = snapshot?.structureKey === structure.key ? snapshot : null
  const isMeasuring = currentSnapshot === null || isRemeasuring
  const snapshotRef = useRef(currentSnapshot)
  const isMeasuringRef = useRef(isMeasuring)
  const rowsRef = useRef(new Map<number, HTMLTableRowElement>())
  const rowCallbacksRef = useRef(new Map<number, RefCallback<HTMLTableRowElement>>())
  const observerRef = useRef<ResizeObserver | null>(null)
  const measurementFrameRef = useRef<number | null>(null)
  const restoreFrameRef = useRef<number | null>(null)
  const pendingAnchorRef = useRef<TableScrollAnchor | null>(null)
  const settledAnchorRef = useRef<TableScrollAnchor | null>(null)
  const contentAnchorRef = useRef<TableScrollAnchor | null>(null)
  const contentVersionRef = useRef(cellContents)
  const contentsRef = useRef(cellContents)
  const columnMeasurementsRef = useRef<TableColumnMeasurements>(new Map())
  contentsRef.current = cellContents
  snapshotRef.current = currentSnapshot
  isMeasuringRef.current = isMeasuring

  // Capture before React commits new cell values: shrinking rows at the end
  // can clamp scrollTop before the row observer gets a chance to measure them.
  if (contentVersionRef.current !== cellContents) {
    contentVersionRef.current = cellContents
    if (currentSnapshot && viewportRef.current) {
      contentAnchorRef.current ??= captureTableScrollAnchor(
        currentSnapshot,
        viewportRef.current.scrollTop
      )
    }
  }

  const getScrollTop = useCallback(() => {
    const current = snapshotRef.current
    const anchor = pendingAnchorRef.current
    if (current && anchor?.structureKey === current.structureKey) {
      return resolveTableScrollAnchor(current, anchor)
    }
    return viewportRef.current?.scrollTop ?? 0
  }, [viewportRef])

  const scheduleMeasurement = useCallback(() => {
    if (measurementFrameRef.current !== null) return
    measurementFrameRef.current = requestAnimationFrame(() => {
      measurementFrameRef.current = null
      const previous = snapshotRef.current
      if (!previous || isMeasuringRef.current) return
      const anchor = contentAnchorRef.current ?? settledAnchorRef.current
      contentAnchorRef.current = null
      const next = updateTableRowHeights(previous, rowsRef.current)
      if (next === previous) return

      pendingAnchorRef.current ??=
        anchor?.structureKey === previous.structureKey
          ? anchor
          : captureTableScrollAnchor(previous, getScrollTop())
      snapshotRef.current = next
      setSnapshot(next)
    })
  }, [getScrollTop])

  const registerRowRef = useCallback(
    (rowIndex: number): RefCallback<HTMLTableRowElement> => {
      const existing = rowCallbacksRef.current.get(rowIndex)
      if (existing) return existing
      const callback: RefCallback<HTMLTableRowElement> = (element) => {
        const previous = rowsRef.current.get(rowIndex)
        if (previous) observerRef.current?.unobserve(previous)
        if (element) {
          rowsRef.current.set(rowIndex, element)
          observerRef.current?.observe(element)
          scheduleMeasurement()
        } else {
          rowsRef.current.delete(rowIndex)
        }
      }
      rowCallbacksRef.current.set(rowIndex, callback)
      return callback
    },
    [scheduleMeasurement]
  )

  useLayoutEffect(() => {
    if (!isMeasuring) return
    const table = tableRef.current
    const surface = surfaceRef.current
    if (!table || !surface) return

    const measuredSnapshot = measureTableLayout(
      table,
      surface,
      structure,
      model,
      snapshotRef.current?.columnWidths
    )
    if (measuredSnapshot) {
      const columns = measureTableColumns(table, model, contentsRef.current)
      columnMeasurementsRef.current = columns.measurements
      const nextSnapshot = updateTableColumnWidths(measuredSnapshot, columns.widths)
      snapshotRef.current = nextSnapshot
      setSnapshot(nextSnapshot)
      setIsRemeasuring(false)
    }
  }, [isMeasuring, model, structure, surfaceRef, tableRef])

  useLayoutEffect(() => {
    const table = tableRef.current
    const current = snapshotRef.current
    if (!table || !current || isMeasuringRef.current) return
    const columns = measureTableColumns(table, model, cellContents, columnMeasurementsRef.current)
    columnMeasurementsRef.current = columns.measurements
    let next = updateTableColumnWidths(current, columns.widths)
    const offscreenHeights = measureChangedOffscreenRows(
      table,
      structure,
      next,
      columns.measurements,
      columns.changedKeys,
      rowsRef.current
    )
    next = updateTableRowHeights(next, rowsRef.current, offscreenHeights)
    if (next === current) return

    const anchor = contentAnchorRef.current ?? settledAnchorRef.current
    pendingAnchorRef.current ??=
      anchor?.structureKey === current.structureKey
        ? anchor
        : captureTableScrollAnchor(current, getScrollTop())
    snapshotRef.current = next
    setSnapshot(next)
  }, [cellContents, getScrollTop, model, structure, tableRef])

  // The virtual spacers may require another layout commit. Keep the anchor
  // available to the virtual window until that commit has updated the DOM.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const anchor = pendingAnchorRef.current
    if (!viewport || !anchor || isMeasuring) return
    if (anchor.structureKey !== currentSnapshot?.structureKey) {
      pendingAnchorRef.current = null
      return
    }
    viewport.scrollTop = getScrollTop()
    if (restoreFrameRef.current !== null) cancelAnimationFrame(restoreFrameRef.current)
    restoreFrameRef.current = requestAnimationFrame(() => {
      restoreFrameRef.current = null
      if (pendingAnchorRef.current !== anchor) return
      viewport.scrollTop = getScrollTop()
      pendingAnchorRef.current = null
      const current = snapshotRef.current
      if (current) {
        settledAnchorRef.current = captureTableScrollAnchor(current, viewport.scrollTop)
      }
    })
  })

  useLayoutEffect(() => {
    const observer = new ResizeObserver(scheduleMeasurement)
    observerRef.current = observer
    rowsRef.current.forEach((row) => observer.observe(row))
    let pixelRatio = window.devicePixelRatio
    const requestFullMeasurement = () => {
      const current = snapshotRef.current
      if (current) {
        const anchor = contentAnchorRef.current ?? settledAnchorRef.current
        pendingAnchorRef.current ??=
          anchor?.structureKey === current.structureKey
            ? anchor
            : captureTableScrollAnchor(current, getScrollTop())
        contentAnchorRef.current = null
      }
      setIsRemeasuring(true)
    }
    const handleResize = () => {
      if (window.devicePixelRatio === pixelRatio) return
      pixelRatio = window.devicePixelRatio
      requestFullMeasurement()
    }
    const viewport = viewportRef.current
    const rememberScrollAnchor = () => {
      const current = snapshotRef.current
      if (
        !current ||
        pendingAnchorRef.current ||
        contentAnchorRef.current ||
        isMeasuringRef.current
      ) {
        return
      }
      settledAnchorRef.current = captureTableScrollAnchor(current, viewport?.scrollTop ?? 0)
    }

    rememberScrollAnchor()
    viewport?.addEventListener('scroll', rememberScrollAnchor, { passive: true })
    window.addEventListener('resize', handleResize)
    document.fonts?.addEventListener('loadingdone', requestFullMeasurement)
    return () => {
      observer.disconnect()
      observerRef.current = null
      viewport?.removeEventListener('scroll', rememberScrollAnchor)
      window.removeEventListener('resize', handleResize)
      document.fonts?.removeEventListener('loadingdone', requestFullMeasurement)
      if (measurementFrameRef.current !== null) {
        cancelAnimationFrame(measurementFrameRef.current)
        measurementFrameRef.current = null
      }
      if (restoreFrameRef.current !== null) {
        cancelAnimationFrame(restoreFrameRef.current)
        restoreFrameRef.current = null
      }
    }
  }, [getScrollTop, scheduleMeasurement, viewportRef])

  useLayoutEffect(() => {
    scheduleMeasurement()
  }, [cellContents, scheduleMeasurement])

  useLayoutEffect(() => {
    rowCallbacksRef.current.forEach((_, rowIndex) => {
      if (rowIndex >= structure.rows.length) rowCallbacksRef.current.delete(rowIndex)
    })
  }, [structure])

  return {
    model,
    snapshot: currentSnapshot,
    isMeasuring,
    registerRowRef,
    getScrollTop
  }
}
