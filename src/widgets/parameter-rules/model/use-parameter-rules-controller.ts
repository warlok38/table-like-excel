'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  useDeleteParameterMutation,
  useGetParametersQuery,
  useSaveParameterMutation
} from '../api/parameter-rules-api'
import {
  getParameterRows,
  emptyRuleCatalogs,
  type ParameterConfiguration,
  type SaveParameterInput
} from './parameter-rules'

type ParameterRulesNotifier = {
  success(message: string): unknown
  error(message: string): unknown
}

type WorkspaceView =
  | { type: 'closed' }
  | { type: 'selection' }
  | {
      type: 'editor'
      parameterId: number
      source: 'selection' | 'table'
      configuration?: ParameterConfiguration
    }

export function useParameterRulesController(notifier: ParameterRulesNotifier) {
  const parametersQuery = useGetParametersQuery()
  const { refetch } = parametersQuery
  const [saveParameter, saveState] = useSaveParameterMutation()
  const [deleteParameter, deleteState] = useDeleteParameterMutation()
  const [view, setView] = useState<WorkspaceView>({ type: 'closed' })
  const snapshot = parametersQuery.currentData

  const rows = useMemo(() => (snapshot ? getParameterRows(snapshot) : []), [snapshot])
  const isMutationPending = saveState.isLoading || deleteState.isLoading
  const isInteractionDisabled = isMutationPending || parametersQuery.isFetching
  const hasInitialLoadError = parametersQuery.isError && !snapshot
  const hasRefreshError = parametersQuery.isError && Boolean(snapshot)

  const openCreate = useCallback(() => {
    if (isInteractionDisabled) return
    setView({ type: 'selection' })
  }, [isInteractionDisabled])

  const openEdit = useCallback(
    (configuration: ParameterConfiguration) => {
      if (isInteractionDisabled) return
      setView({
        type: 'editor',
        parameterId: configuration.parameterId,
        source: 'table',
        configuration
      })
    },
    [isInteractionDisabled]
  )

  const closeEditor = useCallback(() => {
    if (!isMutationPending) setView({ type: 'closed' })
  }, [isMutationPending])

  const selectParameter = (parameterId: number) => {
    if (isInteractionDisabled || !snapshot?.catalog.some((item) => item.id === parameterId)) return
    setView({
      type: 'editor',
      parameterId,
      source: 'selection',
      configuration: snapshot.configurations.find((item) => item.parameterId === parameterId)
    })
  }

  const saveConfiguration = useCallback(
    async (configuration: SaveParameterInput) => {
      if (isInteractionDisabled) return

      try {
        await saveParameter(configuration).unwrap()
        setView({ type: 'closed' })
        notifier.success('Правила сохранены')
      } catch {
        notifier.error('Не удалось сохранить правила. Изменения остались в форме.')
      }
    },
    [isInteractionDisabled, notifier, saveParameter]
  )

  const deleteConfiguration = useCallback(
    async (configuration: ParameterConfiguration) => {
      if (isInteractionDisabled) return

      try {
        await deleteParameter(configuration.parameterId).unwrap()
        setView({ type: 'closed' })
        notifier.success('Все правила параметра удалены')
      } catch (error) {
        notifier.error('Не удалось удалить правила. Попробуйте ещё раз.')
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
    ruleCatalogs: snapshot?.ruleCatalogs ?? emptyRuleCatalogs,
    configurations: snapshot?.configurations ?? [],
    isInitialLoading: parametersQuery.isLoading,
    hasInitialLoadError,
    hasRefreshError,
    isInteractionDisabled,
    canCreate: Boolean(snapshot) && !isInteractionDisabled,
    view,
    selectParameter,
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
