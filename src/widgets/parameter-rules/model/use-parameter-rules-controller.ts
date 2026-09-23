'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  useDeleteParameterMutation,
  useGetParametersQuery,
  useSaveParameterMutation
} from '../api/parameter-rules-api'
import {
  getParameterRows,
  type ParameterConfiguration,
  type SaveParameterInput
} from './parameter-rules'

type ParameterRulesNotifier = {
  success(message: string): unknown
  error(message: string): unknown
}

export function useParameterRulesController(notifier: ParameterRulesNotifier) {
  const parametersQuery = useGetParametersQuery()
  const { refetch } = parametersQuery
  const [saveParameter, saveState] = useSaveParameterMutation()
  const [deleteParameter, deleteState] = useDeleteParameterMutation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingConfiguration, setEditingConfiguration] = useState<ParameterConfiguration>()
  const snapshot = parametersQuery.currentData

  const rows = useMemo(() => (snapshot ? getParameterRows(snapshot) : []), [snapshot])
  const saving = saveState.isLoading || deleteState.isLoading
  const actionsBlocked = saving || parametersQuery.isFetching
  const initialError = parametersQuery.isError && !snapshot
  const refreshError = parametersQuery.isError && Boolean(snapshot)

  const openCreate = useCallback(() => {
    if (actionsBlocked) return
    setEditingConfiguration(undefined)
    setEditorOpen(true)
  }, [actionsBlocked])

  const openEdit = useCallback(
    (configuration: ParameterConfiguration) => {
      if (actionsBlocked) return
      setEditingConfiguration(configuration)
      setEditorOpen(true)
    },
    [actionsBlocked]
  )

  const closeEditor = useCallback(() => {
    setEditorOpen(false)
  }, [])

  const saveConfiguration = useCallback(
    async (configuration: SaveParameterInput) => {
      if (actionsBlocked) return

      try {
        await saveParameter(configuration).unwrap()
        setEditorOpen(false)
        notifier.success(editingConfiguration ? 'Изменения сохранены' : 'Параметр добавлен')
      } catch {
        notifier.error('Не удалось сохранить параметр. Изменения остались в форме.')
      }
    },
    [actionsBlocked, editingConfiguration, notifier, saveParameter]
  )

  const deleteConfiguration = useCallback(
    async (configuration: ParameterConfiguration) => {
      if (actionsBlocked) return

      try {
        await deleteParameter(configuration.parameterId).unwrap()
        setEditorOpen(false)
        notifier.success('Параметр удалён')
      } catch (error) {
        notifier.error('Не удалось удалить параметр. Попробуйте ещё раз.')
        throw error
      }
    },
    [actionsBlocked, deleteParameter, notifier]
  )

  const retry = useCallback(() => {
    void refetch()
  }, [refetch])

  return {
    rows,
    catalog: snapshot?.catalog ?? [],
    configurations: snapshot?.configurations ?? [],
    isLoading: parametersQuery.isLoading,
    initialError,
    refreshError,
    actionsBlocked,
    canCreate: Boolean(snapshot) && !actionsBlocked,
    editorOpen,
    editingConfiguration,
    saving,
    openCreate,
    openEdit,
    closeEditor,
    retry,
    saveConfiguration,
    deleteConfiguration
  }
}

export type ParameterRulesController = ReturnType<typeof useParameterRulesController>
