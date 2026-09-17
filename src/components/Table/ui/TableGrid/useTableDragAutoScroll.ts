'use client'

import { useEffect, type RefObject } from 'react'

const EDGE_SIZE = 48
const MIN_SPEED = 2
const MAX_SPEED = 20

type EdgeMotion = {
  direction: -1 | 0 | 1
  speed: number
}

type UseTableDragAutoScrollOptions = {
  viewportRef: RefObject<HTMLDivElement>
  isDragging: boolean
  onExtendSelection: (cellKey: string) => void
}

export function useTableDragAutoScroll({
  viewportRef,
  isDragging,
  onExtendSelection
}: UseTableDragAutoScrollOptions) {
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !isDragging) return

    let frame: number | null = null
    let pointer: { x: number; y: number } | null = null

    const getEdgeMotion = (position: number, start: number, end: number): EdgeMotion => {
      const startDistance = position - start
      const endDistance = end - position
      let direction: EdgeMotion['direction'] = 0
      let proximity = 0

      if (startDistance < EDGE_SIZE) {
        direction = -1
        proximity = Math.min(1, Math.max(0, (EDGE_SIZE - startDistance) / EDGE_SIZE))
      } else if (endDistance < EDGE_SIZE) {
        direction = 1
        proximity = Math.min(1, Math.max(0, (EDGE_SIZE - endDistance) / EDGE_SIZE))
      }

      return {
        direction,
        speed: direction === 0 ? 0 : MIN_SPEED + (MAX_SPEED - MIN_SPEED) * proximity
      }
    }

    const extendToEdgeCell = (
      horizontal: EdgeMotion,
      vertical: EdgeMotion,
      viewportRect: DOMRect
    ) => {
      const stickyRow = viewport.querySelector<HTMLTableRowElement>('tr[data-table-row-index="0"]')
      const stickyHeight = stickyRow?.getBoundingClientRect().height ?? 0
      let targetY = Math.min(
        viewportRect.bottom - 1,
        Math.max(viewportRect.top + 1, pointer?.y ?? viewportRect.top + 1)
      )
      let targetX = Math.min(
        viewportRect.right - 1,
        Math.max(viewportRect.left + 1, pointer?.x ?? viewportRect.left + 1)
      )

      if (vertical.direction < 0) {
        targetY = Math.min(viewportRect.bottom - 1, viewportRect.top + stickyHeight + 1)
      } else if (vertical.direction > 0) {
        targetY = viewportRect.bottom - 1
      }

      if (horizontal.direction < 0) {
        targetX = viewportRect.left + 1
      } else if (horizontal.direction > 0) {
        targetX = viewportRect.right - 1
      }
      const cell = document
        .elementFromPoint(targetX, targetY)
        ?.closest<HTMLElement>('[data-cell-key]')

      if (cell && viewport.contains(cell) && cell.dataset.cellKey) {
        onExtendSelection(cell.dataset.cellKey)
      }
    }

    const tick = () => {
      frame = null
      if (!pointer) return

      const rect = viewport.getBoundingClientRect()
      const isHorizontallyInside = pointer.x >= rect.left && pointer.x <= rect.right
      const isVerticallyInside = pointer.y >= rect.top && pointer.y <= rect.bottom
      const horizontal = isVerticallyInside
        ? getEdgeMotion(pointer.x, rect.left, rect.right)
        : { direction: 0 as const, speed: 0 }
      const vertical = isHorizontallyInside
        ? getEdgeMotion(pointer.y, rect.top, rect.bottom)
        : { direction: 0 as const, speed: 0 }

      if (horizontal.direction === 0 && vertical.direction === 0) return

      const previousScrollLeft = viewport.scrollLeft
      const previousScrollTop = viewport.scrollTop
      viewport.scrollLeft += horizontal.direction * horizontal.speed
      viewport.scrollTop += vertical.direction * vertical.speed

      if (viewport.scrollLeft !== previousScrollLeft || viewport.scrollTop !== previousScrollTop) {
        extendToEdgeCell(horizontal, vertical, rect)
        frame = requestAnimationFrame(tick)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
      if (frame === null) frame = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [isDragging, onExtendSelection, viewportRef])
}
