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
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingConfiguration, setEditingConfiguration] = useState<ParameterConfiguration>()
  const snapshot = parametersQuery.currentData

  const rows = useMemo(() => (snapshot ? getParameterRows(snapshot) : []), [snapshot])
  const isMutationPending = saveState.isLoading || deleteState.isLoading
  const isInteractionDisabled = isMutationPending || parametersQuery.isFetching
  const hasInitialLoadError = parametersQuery.isError && !snapshot
  const hasRefreshError = parametersQuery.isError && Boolean(snapshot)

  const openCreate = useCallback(() => {
    if (isInteractionDisabled) return
    setEditingConfiguration(undefined)
    setIsEditorOpen(true)
  }, [isInteractionDisabled])

  const openEdit = useCallback(
    (configuration: ParameterConfiguration) => {
      if (isInteractionDisabled) return
      setEditingConfiguration(configuration)
      setIsEditorOpen(true)
    },
    [isInteractionDisabled]
  )

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false)
  }, [])

  const saveConfiguration = useCallback(
    async (configuration: SaveParameterInput) => {
      if (isInteractionDisabled) return

      try {
        await saveParameter(configuration).unwrap()
        setIsEditorOpen(false)
        notifier.success(editingConfiguration ? 'Изменения сохранены' : 'Параметр добавлен')
      } catch {
        notifier.error('Не удалось сохранить параметр. Изменения остались в форме.')
      }
    },
    [editingConfiguration, isInteractionDisabled, notifier, saveParameter]
  )

  const deleteConfiguration = useCallback(
    async (configuration: ParameterConfiguration) => {
      if (isInteractionDisabled) return

      try {
        await deleteParameter(configuration.parameterId).unwrap()
        setIsEditorOpen(false)
        notifier.success('Параметр удалён')
      } catch (error) {
        notifier.error('Не удалось удалить параметр. Попробуйте ещё раз.')
        throw error
      }
    },
    [deleteParameter, isInteractionDisabled, notifier]
  )

  const retry = useCallback(() => {
    void refetch()
  }, [refetch])

  return {
    rows,
    catalog: snapshot?.catalog ?? [],
    configurations: snapshot?.configurations ?? [],
    isInitialLoading: parametersQuery.isLoading,
    hasInitialLoadError,
    hasRefreshError,
    isInteractionDisabled,
    canCreate: Boolean(snapshot) && !isInteractionDisabled,
    isEditorOpen,
    editingConfiguration,
    isMutationPending,
    openCreate,
    openEdit,
    closeEditor,
    retry,
    saveConfiguration,
    deleteConfiguration
  }
}

export type ParameterRulesController = ReturnType<typeof useParameterRulesController>
