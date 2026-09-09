'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CellValue } from '@/types'
import { getCellCapabilities } from '../helpers'
import type { CellSelectionEntry } from '../helpers/cell-key'
import { isDateAllowed } from '../editing/date-calendar'
import {
  getEffectiveValue,
  getInitialDraft,
  normalizeCommittedValue,
  normalizeNumberDraft
} from '../editing/value-conversion'
import type { EditStart, EditingSession, PendingValues } from '../editing/types'

type EditingState = {
  pendingValues: PendingValues
  session: EditingSession | null
}

const emptyState: EditingState = {
  pendingValues: {},
  session: null
}

export function useTableEditing(entries: CellSelectionEntry[]) {
  const stateRef = useRef<EditingState>(emptyState)
  const [state, setState] = useState<EditingState>(emptyState)

  const entriesByKey = useMemo(
    () => new Map(entries.map((entry) => [entry.key, entry] as const)),
    [entries]
  )
  const entriesByKeyRef = useRef(entriesByKey)
  entriesByKeyRef.current = entriesByKey

  const transition = useCallback((updater: (current: EditingState) => EditingState) => {
    const next = updater(stateRef.current)
    stateRef.current = next
    setState(next)
  }, [])

  const writePendingValue = useCallback(
    (pendingValues: PendingValues, cellKey: string, value: CellValue): PendingValues => {
      const entry = entriesByKeyRef.current.get(cellKey)
      if (!entry) return pendingValues

      const next = { ...pendingValues }
      if (value === entry.cell.value) {
        delete next[cellKey]
      } else {
        next[cellKey] = value
      }

      return next
    },
    []
  )

  const commitSession = useCallback(
    (current: EditingState): EditingState => {
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
      return {
        pendingValues: writePendingValue(current.pendingValues, session.cellKey, value),
        session: null
      }
    },
    [writePendingValue]
  )

  const startEditing = useCallback(
    (cellKey: string, start: EditStart) => {
      let didStart = false

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
                getEffectiveValue(cellKey, entry.cell, committed.pendingValues),
                editor
              )

        if (start.kind === 'replace' && editor.type === 'number') {
          const normalized = normalizeNumberDraft(start.text)
          if (normalized === null) {
            return committed
          }
          draft = normalized
        }

        const hasPending = Object.prototype.hasOwnProperty.call(committed.pendingValues, cellKey)

        didStart = true
        return {
          pendingValues: committed.pendingValues,
          session: {
            cellKey,
            editor,
            draft,
            initialPending: {
              exists: hasPending,
              value: hasPending ? committed.pendingValues[cellKey] : null
            }
          }
        }
      })

      return didStart
    },
    [commitSession, transition]
  )

  const updateDraft = useCallback(
    (draft: string) => {
      transition((current) =>
        current.session ? { ...current, session: { ...current.session, draft } } : current
      )
    },
    [transition]
  )

  const chooseValue = useCallback(
    (value: CellValue) => {
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

        return {
          pendingValues: writePendingValue(current.pendingValues, session.cellKey, value),
          session: {
            ...session,
            draft: value === null ? '' : String(value)
          }
        }
      })
    },
    [transition, writePendingValue]
  )

  const commitEditing = useCallback(() => {
    transition((current) => commitSession(current))
  }, [commitSession, transition])

  const cancelEditing = useCallback(() => {
    transition((current) => {
      const session = current.session
      if (!session) return current

      const entry = entriesByKeyRef.current.get(session.cellKey)
      if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
        return { ...current, session: null }
      }

      const next = { ...current.pendingValues }
      if (session.initialPending.exists) {
        next[session.cellKey] = session.initialPending.value
      } else {
        delete next[session.cellKey]
      }

      return {
        pendingValues: next,
        session: null
      }
    })
  }, [transition])

  useEffect(() => {
    const session = stateRef.current.session
    if (!session) return

    const entry = entriesByKeyRef.current.get(session.cellKey)
    if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
      transition((current) => ({ ...current, session: null }))
    }
  }, [entries, transition])

  return {
    pendingValues: state.pendingValues,
    session: state.session,
    startEditing,
    updateDraft,
    chooseValue,
    commitEditing,
    cancelEditing
  }
}
