import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

import type { CellTable, TableSaveChangeset } from '../types'
import { makeSaveChangeset } from '../lib/save-changeset'
import type { TableCellEntry } from '../lib/table-index'
import { hasPendingChanges } from './pending-changes'
import type { PendingChanges } from './pending.types'

type SaveStatus = 'idle' | 'saving' | 'success' | 'failure'

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
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [isSavingRef])

  const clearSaveMessage = useCallback(() => {
    if (isSavingRef.current) return
    setSaveStatus('idle')
    setSaveMessage(null)
  }, [isSavingRef])

  const save = useCallback(async () => {
    if (isSavingRef.current) return

    prepareForSave()

    const snapshot = pendingRef.current
    if (!hasPendingChanges(snapshot)) return

    let changeset: TableSaveChangeset
    try {
      changeset = makeSaveChangeset(snapshot, entriesByKey)
    } catch (error) {
      setSaveStatus('failure')
      setSaveMessage(error instanceof Error ? error.message : 'Не удалось подготовить изменения')
      return
    }

    isSavingRef.current = true
    setIsSaving(true)
    setSaveStatus('saving')
    setSaveMessage('Сохраняем изменения')

    try {
      const confirmedData = await onSaveChanges(changeset)
      if (!mountedRef.current) return

      acceptSavedData(confirmedData)
      resetPending()
      setSaveStatus('success')
      setSaveMessage('Изменения сохранены')
    } catch (error) {
      if (!mountedRef.current) return

      setSaveStatus('failure')
      setSaveMessage(error instanceof Error ? error.message : 'Не удалось сохранить изменения')
    } finally {
      isSavingRef.current = false
      if (mountedRef.current) {
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
    saveMessage,
    clearSaveMessage
  }
}
