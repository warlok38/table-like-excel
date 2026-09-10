import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefCallback,
  type RefObject
} from 'react'

import type { SelectionRect } from '../../lib/selection-outline'

export function useSelectionGeometry(tableRef: RefObject<HTMLTableElement>, structure: string) {
  const cellRefsRef = useRef(new Map<string, HTMLTableCellElement>())
  const refCallbacksRef = useRef(new Map<string, RefCallback<HTMLTableCellElement>>())
  const rectsRef = useRef(new Map<string, SelectionRect>())
  const frameRef = useRef<number | null>(null)
  const [version, setVersion] = useState(0)

  const measure = useCallback(() => {
    const table = tableRef.current
    const wrapper = table?.parentElement
    if (!table || !wrapper) return

    const origin = wrapper.getBoundingClientRect()
    const rects = new Map<string, SelectionRect>()

    cellRefsRef.current.forEach((cell, key) => {
      const rect = cell.getBoundingClientRect()
      rects.set(key, {
        left: rect.left - origin.left,
        right: rect.right - origin.left,
        top: rect.top - origin.top,
        bottom: rect.bottom - origin.top
      })
    })

    rectsRef.current = rects
    setVersion((current) => current + 1)
  }, [tableRef])

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current !== null) return

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      measure()
    })
  }, [measure])

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

    return () => {
      observer.disconnect()
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [scheduleMeasure, tableRef])

  return {
    rectsRef,
    registerCellRef,
    version
  }
}
