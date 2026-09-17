import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

import type { CellTable, TableSaveChangeset } from '../table'
import { makeSaveChangeset } from './saveChangeset'
import type { TableCellEntry } from '../data/tableIndex'
import { hasPendingChanges, type PendingChanges } from '../changes/pendingChanges'

export type TableSaveStatus = 'idle' | 'saving' | 'success' | 'failure'

const SAVE_STATUS_RESET_DELAY_MS = 3000

type UseTableSaveOptions = {
  isSavingRef: MutableRefObject<boolean>
  pendingRef: MutableRefObject<PendingChanges>
  entriesByKey: Map<string, TableCellEntry>
  onSaveChanges: (changeset: TableSaveChangeset) => Promise<CellTable[][]>
  acceptSavedData: (data: CellTable[][]) => void
  resetPending: () => void
  prepareForSave: () => void
}

export function useTableSave({
  isSavingRef,
  pendingRef,
  entriesByKey,
  onSaveChanges,
  acceptSavedData,
  resetPending,
  prepareForSave
}: UseTableSaveOptions) {
  const mountedRef = useRef(true)
  const lifecycleRef = useRef(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<TableSaveStatus>('idle')

  useEffect(() => {
    mountedRef.current = true
    lifecycleRef.current += 1
    isSavingRef.current = false
    setIsSaving(false)
    setSaveStatus('idle')
    return () => {
      mountedRef.current = false
      lifecycleRef.current += 1
      isSavingRef.current = false
    }
  }, [isSavingRef])

  useEffect(() => {
    if (saveStatus !== 'success' && saveStatus !== 'failure') return

    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current && !isSavingRef.current) {
        setSaveStatus('idle')
      }
    }, SAVE_STATUS_RESET_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isSavingRef, saveStatus])

  const clearSaveStatus = useCallback(() => {
    if (!mountedRef.current || isSavingRef.current) return
    setSaveStatus('idle')
  }, [isSavingRef])

  const save = useCallback(async () => {
    if (!mountedRef.current || isSavingRef.current) return

    prepareForSave()

    const snapshot = pendingRef.current
    if (!hasPendingChanges(snapshot)) return

    let changeset: TableSaveChangeset
    try {
      changeset = makeSaveChangeset(snapshot, entriesByKey)
    } catch {
      setSaveStatus('failure')
      return
    }

    isSavingRef.current = true
    const lifecycle = lifecycleRef.current
    const isCurrentLifecycle = () => mountedRef.current && lifecycleRef.current === lifecycle
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const confirmedData = await onSaveChanges(changeset)
      if (!isCurrentLifecycle()) return

      acceptSavedData(confirmedData)
      resetPending()
      setSaveStatus('success')
    } catch {
      if (!isCurrentLifecycle()) return

      setSaveStatus('failure')
    } finally {
      if (isCurrentLifecycle()) {
        isSavingRef.current = false
        setIsSaving(false)
      }
    }
  }, [
    acceptSavedData,
    entriesByKey,
    isSavingRef,
    onSaveChanges,
    pendingRef,
    prepareForSave,
    resetPending
  ])

  return {
    save,
    isSaving,
    isSavingRef,
    saveStatus,
    clearSaveStatus
  }
}
