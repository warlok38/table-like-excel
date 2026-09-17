'use client'

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'

import {
  calculateVirtualRowWindow,
  type TableLayoutSnapshot,
  type VirtualRowWindow
} from './tableLayout'

type UseTableVirtualRowsOptions = {
  viewportRef: RefObject<HTMLDivElement>
  snapshot: TableLayoutSnapshot | null
  enabled: boolean
  activeCellKey: string | null
  onBeforeWindowChange: (nextWindow: VirtualRowWindow) => void
}

export function useTableVirtualRows({
  viewportRef,
  snapshot,
  enabled,
  activeCellKey,
  onBeforeWindowChange
}: UseTableVirtualRowsOptions) {
  const callbackRef = useRef(onBeforeWindowChange)
  const frameRef = useRef<number | null>(null)
  const windowRef = useRef<VirtualRowWindow | null>(null)
  const [window, setWindow] = useState<VirtualRowWindow | null>(null)
  callbackRef.current = onBeforeWindowChange

  const updateWindow = useCallback(() => {
    const viewport = viewportRef.current
    if (!enabled || !snapshot || !viewport) {
      windowRef.current = null
      setWindow(null)
      return
    }

    const nextWindow = calculateVirtualRowWindow(
      snapshot,
      viewport.scrollTop,
      viewport.clientHeight
    )

    const current = windowRef.current
    if (
      current &&
      current.pinnedRowEnd === nextWindow.pinnedRowEnd &&
      current.start === nextWindow.start &&
      current.end === nextWindow.end &&
      current.paddingTop === nextWindow.paddingTop &&
      current.paddingBottom === nextWindow.paddingBottom
    ) {
      return
    }

    callbackRef.current(nextWindow)
    windowRef.current = nextWindow
    setWindow(nextWindow)
  }, [enabled, snapshot, viewportRef])

  const scheduleUpdate = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      updateWindow()
    })
  }, [updateWindow])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !enabled || !snapshot) {
      windowRef.current = null
      setWindow(null)
      return
    }

    updateWindow()
    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(viewport)
    viewport.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      observer.disconnect()
      viewport.removeEventListener('scroll', scheduleUpdate)
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [enabled, scheduleUpdate, snapshot, updateWindow, viewportRef])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !enabled || !snapshot || !activeCellKey) return

    const rowIndex = snapshot.rowByCellKey.get(activeCellKey)
    if (rowIndex === undefined || rowIndex <= snapshot.pinnedRowEnd) return

    const rowTop = snapshot.rowOffsets[rowIndex]
    const rowBottom = snapshot.rowOffsets[rowIndex + 1]
    const viewportTop = viewport.scrollTop
    const viewportBottom = viewportTop + viewport.clientHeight
    const stickyRowHeight = snapshot.rowHeights[0] ?? 0

    if (rowTop < viewportTop + stickyRowHeight) {
      viewport.scrollTop = Math.max(0, rowTop - stickyRowHeight)
    } else if (rowBottom > viewportBottom) {
      viewport.scrollTop = Math.max(0, rowBottom - viewport.clientHeight)
    }
  }, [activeCellKey, enabled, snapshot, viewportRef])

  return window
}
