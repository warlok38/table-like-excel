'use client'

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

import type { CellValue } from '../table'
import { getCellCapabilities } from '../cellCapabilities'
import type { TableCellEntry } from '../data/tableIndex'
import { isDateAllowed } from './dateRules'
import {
  getEffectiveValue,
  getInitialDraft,
  normalizeCommittedValue,
  normalizeNumberDraft
} from './valueConversion'
import type { EditStart, EditingSession, PendingValues } from './editingSession'

type EditingState = {
  session: EditingSession | null
}

const emptyState: EditingState = {
  session: null
}

type UseTableEditingOptions = {
  onLocalChange: () => void
  entriesByKey: Map<string, TableCellEntry>
  pendingValues: PendingValues
  onPendingValueChange: (cellKey: string, value: CellValue) => void
  isBlockedRef?: MutableRefObject<boolean>
}

export function useTableEditing({
  entriesByKey,
  onLocalChange,
  pendingValues,
  onPendingValueChange,
  isBlockedRef
}: UseTableEditingOptions) {
  const stateRef = useRef<EditingState>(emptyState)
  const [state, setState] = useState<EditingState>(emptyState)
  const pendingValuesRef = useRef(pendingValues)
  pendingValuesRef.current = pendingValues
  const onPendingValueChangeRef = useRef(onPendingValueChange)
  onPendingValueChangeRef.current = onPendingValueChange

  const entriesByKeyRef = useRef(entriesByKey)
  entriesByKeyRef.current = entriesByKey

  const transition = useCallback((updater: (current: EditingState) => EditingState) => {
    const next = updater(stateRef.current)
    stateRef.current = next
    setState(next)
  }, [])

  const commitSession = useCallback((current: EditingState): EditingState => {
    const session = current.session
    if (!session) return current

    const entry = entriesByKeyRef.current.get(session.cellKey)
    if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
      return { ...current, session: null }
    }

    if (session.editor.type === 'select' || session.editor.type === 'date') {
      return { ...current, session: null }
    }

    const value = normalizeCommittedValue(session.draft, session.editor)
    onPendingValueChangeRef.current(session.cellKey, value)
    return { session: null }
  }, [])

  const startEditing = useCallback(
    (cellKey: string, start: EditStart) => {
      let didStart = false
      if (isBlockedRef?.current) return didStart

      transition((current) => {
        if (current.session?.cellKey === cellKey) {
          didStart = true
          return current
        }

        const committed = commitSession(current)
        const entry = entriesByKeyRef.current.get(cellKey)
        if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
          return committed
        }

        const editor = entry.cell.data.editor
        if (!editor || editor.type === 'readonly') {
          return committed
        }

        let draft =
          start.kind === 'replace'
            ? start.text
            : getInitialDraft(
                getEffectiveValue(cellKey, entry.cell, pendingValuesRef.current),
                editor
              )

        if (start.kind === 'replace' && editor.type === 'number') {
          const normalized = normalizeNumberDraft(start.text)
          if (normalized === null) {
            return committed
          }
          draft = normalized
        }

        const hasPending = Object.prototype.hasOwnProperty.call(pendingValuesRef.current, cellKey)

        didStart = true
        if (start.kind === 'replace') onLocalChange()
        return {
          session: {
            cellKey,
            editor,
            draft,
            initialPending: {
              exists: hasPending,
              value: hasPending ? pendingValuesRef.current[cellKey] : null
            }
          }
        }
      })

      return didStart
    },
    [commitSession, isBlockedRef, onLocalChange, transition]
  )

  const updateDraft = useCallback(
    (draft: string) => {
      if (isBlockedRef?.current) return
      if (stateRef.current.session?.draft !== draft && stateRef.current.session) onLocalChange()
      if (isBlockedRef?.current) return

      transition((current) =>
        current.session ? { ...current, session: { ...current.session, draft } } : current
      )
    },
    [isBlockedRef, onLocalChange, transition]
  )

  const chooseValue = useCallback(
    (value: CellValue) => {
      if (isBlockedRef?.current) return

      transition((current) => {
        const session = current.session
        if (!session || (session.editor.type !== 'select' && session.editor.type !== 'date')) {
          return current
        }

        const entry = entriesByKeyRef.current.get(session.cellKey)
        if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
          return { ...current, session: null }
        }

        if (session.editor.type === 'select') {
          const isAllowed =
            value === null ||
            (typeof value === 'string' &&
              session.editor.options.some((option) => option.value === value))
          if (!isAllowed) return current
        }

        if (session.editor.type === 'date') {
          const isAllowed =
            value === null ||
            (typeof value === 'string' &&
              isDateAllowed(value, session.editor.min, session.editor.max))
          if (!isAllowed) return current
        }

        onPendingValueChangeRef.current(session.cellKey, value)

        return {
          session: {
            ...session,
            draft: value === null ? '' : String(value)
          }
        }
      })
    },
    [isBlockedRef, transition]
  )

  const commitEditing = useCallback(() => {
    if (isBlockedRef?.current) return
    transition((current) => commitSession(current))
  }, [commitSession, isBlockedRef, transition])

  const cancelEditing = useCallback(() => {
    if (isBlockedRef?.current) return
    transition((current) => {
      const session = current.session
      if (!session) return current

      const entry = entriesByKeyRef.current.get(session.cellKey)
      if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
        return { ...current, session: null }
      }

      if (session.initialPending.exists) {
        onPendingValueChangeRef.current(session.cellKey, session.initialPending.value)
      } else {
        onPendingValueChangeRef.current(session.cellKey, entry.cell.value)
      }

      return { session: null }
    })
  }, [isBlockedRef, transition])

  useEffect(() => {
    const session = stateRef.current.session
    if (!session) return

    const entry = entriesByKeyRef.current.get(session.cellKey)
    if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
      transition((current) => ({ ...current, session: null }))
    }
  }, [entriesByKey, transition])

  return {
    session: state.session,
    startEditing,
    updateDraft,
    chooseValue,
    commitEditing,
    cancelEditing
  }
}
