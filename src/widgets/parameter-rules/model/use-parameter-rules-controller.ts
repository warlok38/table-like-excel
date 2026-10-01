'use client'
import { useCallback, useMemo, useState } from 'react'
import { useGetRuleCatalogsQuery, useGetRulesByParameterQuery } from '../api/parameter-rules-api'
import { toSnapshot } from '../api/parameter-rules-adapter'
import { mockContext } from '../api/mock/parameter-rules-data'
import { getParameterRows, emptyRuleCatalogs, type ParameterConfiguration } from './parameter-rules'
type Notifier = { success(message: string): unknown; error(message: string): unknown }
type WorkspaceView =
  | { type: 'closed' }
  | { type: 'selection' }
  | {
      type: 'editor'
      parameterId: string
      source: 'selection' | 'table'
      configuration?: ParameterConfiguration
    }
export function useParameterRulesController(notifier: Notifier) {
  const journalId = mockContext.journalId
  const catalogs = useGetRuleCatalogsQuery(journalId),
    rules = useGetRulesByParameterQuery(journalId)
  const [view, setView] = useState<WorkspaceView>({ type: 'closed' })
  const snapshot = useMemo(
    () =>
      catalogs.currentData && rules.currentData
        ? toSnapshot(catalogs.currentData, rules.currentData, journalId)
        : undefined,
    [catalogs.currentData, rules.currentData, journalId]
  )
  const rows = useMemo(() => (snapshot ? getParameterRows(snapshot) : []), [snapshot])
  const isInteractionDisabled =
    catalogs.isFetching || rules.isFetching || catalogs.isError || rules.isError || !snapshot
  const { refetch: refetchCatalogs } = catalogs
  const { refetch: refetchRules } = rules
  const reload = useCallback(async () => {
    const results = await Promise.allSettled([refetchCatalogs().unwrap(), refetchRules().unwrap()])
    const [a, b] = results
    if (a.status === 'rejected' || b.status === 'rejected')
      throw new Error('Не удалось обновить данные')
    return toSnapshot(a.value, b.value, journalId)
  }, [refetchCatalogs, refetchRules, journalId])
  const openCreate = () => {
    if (!isInteractionDisabled) setView({ type: 'selection' })
  }
  const openEdit = (configuration: ParameterConfiguration) => {
    if (!isInteractionDisabled)
      setView({
        type: 'editor',
        parameterId: configuration.parameterId,
        source: 'table',
        configuration
      })
  }
  const selectParameter = (parameterId: string) => {
    if (isInteractionDisabled || !snapshot?.catalog.some((item) => item.id === parameterId)) return
    setView({
      type: 'editor',
      parameterId,
      source: 'selection',
      configuration: snapshot.configurations.find((item) => item.parameterId === parameterId)
    })
  }
  return {
    rows,
    catalog: snapshot?.catalog ?? [],
    ruleCatalogs: snapshot?.ruleCatalogs ?? emptyRuleCatalogs,
    configurations: snapshot?.configurations ?? [],
    isRefreshing: catalogs.isFetching || rules.isFetching,
    isInitialLoading: !snapshot && (catalogs.isLoading || rules.isLoading),
    hasInitialLoadError: !snapshot && (catalogs.isError || rules.isError),
    hasRefreshError: Boolean(snapshot) && (catalogs.isError || rules.isError),
    isInteractionDisabled,
    canCreate: Boolean(snapshot) && !isInteractionDisabled,
    view,
    selectParameter,
    openCreate,
    openEdit,
    closeEditor: () => setView({ type: 'closed' }),
    retry: () => {
      void reload().catch(() => notifier.error('Не удалось обновить данные'))
    },
    reload,
    saved: () => {
      notifier.success('Правила сохранены')
      setView({ type: 'closed' })
    }
  }
}
export type ParameterRulesController = ReturnType<typeof useParameterRulesController>
