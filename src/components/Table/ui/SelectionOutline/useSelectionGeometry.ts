import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefCallback,
  type RefObject
} from 'react'

import type { SelectionRect } from './makeSelectionOutline'

export function useSelectionGeometry(tableRef: RefObject<HTMLTableElement>, structure: string) {
  const cellRefsRef = useRef(new Map<string, HTMLTableCellElement>())
  const refCallbacksRef = useRef(new Map<string, RefCallback<HTMLTableCellElement>>())
  const rectsRef = useRef(new Map<string, SelectionRect>())
  const frameRef = useRef<number | null>(null)
  const fullMeasureRef = useRef(false)
  const [version, setVersion] = useState(0)

  const measure = useCallback(
    (stickyOnly = false) => {
      const table = tableRef.current
      const wrapper = table?.parentElement
      if (!table || !wrapper) return

      const origin = wrapper.getBoundingClientRect()
      const rects = stickyOnly ? new Map(rectsRef.current) : new Map<string, SelectionRect>()

      const cells = stickyOnly
        ? new Map(
            Array.from(table.rows[0]?.cells ?? []).map((cell) => [cell.dataset.cellKey!, cell])
          )
        : cellRefsRef.current
      cells.forEach((cell, key) => {
        const rect = cell.getBoundingClientRect()
        rects.set(key, {
          left: rect.left - origin.left,
          right: rect.right - origin.left,
          top: rect.top - origin.top,
          bottom: rect.bottom - origin.top
        })
      })

      const previous = rectsRef.current
      const unchanged =
        previous.size === rects.size &&
        Array.from(rects).every(([key, rect]) => {
          const old = previous.get(key)
          return (
            old &&
            old.left === rect.left &&
            old.right === rect.right &&
            old.top === rect.top &&
            old.bottom === rect.bottom
          )
        })
      if (unchanged) return
      rectsRef.current = rects
      setVersion((current) => current + 1)
    },
    [tableRef]
  )

  const schedule = useCallback(
    (full: boolean) => {
      fullMeasureRef.current ||= full
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        const full = fullMeasureRef.current
        fullMeasureRef.current = false
        measure(!full)
      })
    },
    [measure]
  )
  const scheduleMeasure = useCallback(() => schedule(true), [schedule])
  // Sticky headers really move relative to the surface on scroll; normal
  // cells do not. Refresh just that row, coalesced with pending layout work.
  const scheduleStickyMeasure = useCallback(() => schedule(false), [schedule])

  const registerCellRef = useCallback(
    (cellKey: string): RefCallback<HTMLTableCellElement> => {
      const existing = refCallbacksRef.current.get(cellKey)
      if (existing) return existing

      const callback: RefCallback<HTMLTableCellElement> = (element) => {
        if (element) {
          cellRefsRef.current.set(cellKey, element)
        } else {
          cellRefsRef.current.delete(cellKey)
          rectsRef.current.delete(cellKey)
        }

        scheduleMeasure()
      }

      refCallbacksRef.current.set(cellKey, callback)
      return callback
    },
    [scheduleMeasure]
  )

  useLayoutEffect(() => {
    rectsRef.current = new Map()
    refCallbacksRef.current.forEach((_, key) => {
      if (!cellRefsRef.current.has(key)) {
        refCallbacksRef.current.delete(key)
      }
    })
    scheduleMeasure()
  }, [scheduleMeasure, structure])

  useLayoutEffect(() => {
    const table = tableRef.current
    if (!table) return

    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(table)
    cellRefsRef.current.forEach((cell) => observer.observe(cell))
    window.addEventListener('resize', scheduleMeasure)
    window.addEventListener('scroll', scheduleStickyMeasure, true)
    document.fonts?.addEventListener('loadingdone', scheduleMeasure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', scheduleMeasure)
      window.removeEventListener('scroll', scheduleStickyMeasure, true)
      document.fonts?.removeEventListener('loadingdone', scheduleMeasure)
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [scheduleMeasure, scheduleStickyMeasure, tableRef, structure])

  return {
    rectsRef,
    registerCellRef,
    version
  }
}
