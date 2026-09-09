'use client'

import { useEffect, type RefObject } from 'react'

type UseTableInteractionsOptions = {
  ownerId: string
  rootRef: RefObject<HTMLDivElement>
  onLeaveEditor: () => void
  onLeaveTable: () => void
  hasEditor: boolean
}

export function useTableInteractions({
  ownerId,
  rootRef,
  onLeaveEditor,
  onLeaveTable,
  hasEditor
}: UseTableInteractionsOptions) {
  useEffect(() => {
    function findOwner(event: Event, attribute: 'data-table-owner' | 'data-value-editor-owner') {
      const path = typeof event.composedPath === 'function' ? event.composedPath() : []

      for (const item of path) {
        if (item instanceof Element) {
          const owner = item.closest(`[${attribute}]`)?.getAttribute(attribute)
          if (owner) return owner
        }
      }

      const target = event.target instanceof Element ? event.target : null
      return target?.closest(`[${attribute}]`)?.getAttribute(attribute) ?? null
    }

    function handlePointerDown(event: PointerEvent) {
      const tableOwner = findOwner(event, 'data-table-owner')
      const editorOwner = findOwner(event, 'data-value-editor-owner')

      if (hasEditor && editorOwner !== ownerId) {
        onLeaveEditor()
      }

      if (tableOwner !== ownerId) {
        onLeaveTable()
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!hasEditor) return

      const editorOwner = findOwner(event, 'data-value-editor-owner')
      if (editorOwner !== ownerId) {
        onLeaveEditor()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [hasEditor, onLeaveEditor, onLeaveTable, ownerId, rootRef])
}
