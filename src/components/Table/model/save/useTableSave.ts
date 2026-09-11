import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

import type { CellTable, TableSaveChangeset } from '../table'
import { makeSaveChangeset } from './saveChangeset'
import type { TableCellEntry } from '../data/tableIndex'
import { hasPendingChanges, type PendingChanges } from '../changes/pendingChanges'

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
  const lifecycleRef = useRef(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    lifecycleRef.current += 1
    isSavingRef.current = false
    setIsSaving(false)
    setSaveStatus('idle')
    setSaveMessage(null)
    return () => {
      mountedRef.current = false
      lifecycleRef.current += 1
      isSavingRef.current = false
    }
  }, [isSavingRef])

  const clearSaveMessage = useCallback(() => {
    if (!mountedRef.current || isSavingRef.current) return
    setSaveStatus('idle')
    setSaveMessage(null)
  }, [isSavingRef])

  const save = useCallback(async () => {
    if (!mountedRef.current || isSavingRef.current) return

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
    const lifecycle = lifecycleRef.current
    const isCurrentLifecycle = () => mountedRef.current && lifecycleRef.current === lifecycle
    setIsSaving(true)
    setSaveStatus('saving')
    setSaveMessage('Сохраняем изменения')

    try {
      const confirmedData = await onSaveChanges(changeset)
      if (!isCurrentLifecycle()) return

      acceptSavedData(confirmedData)
      resetPending()
      setSaveStatus('success')
      setSaveMessage('Изменения сохранены')
    } catch (error) {
      if (!isCurrentLifecycle()) return

      setSaveStatus('failure')
      setSaveMessage(error instanceof Error ? error.message : 'Не удалось сохранить изменения')
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
    saveMessage,
    clearSaveMessage
  }
}
