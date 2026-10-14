'use client'
import { useCallback, useMemo, useState } from 'react'
import { useGetRuleCatalogsQuery, useGetRulesByParameterQuery } from '../api/parameterRulesApi'
import {
  toEditorParameter,
  toParameterCatalog,
  toParameterRows,
  toParameterConfiguration,
  toRuleCatalogs,
  getRulesParameterSelectionKey
} from '../api/parameterRulesAdapter'
import type { CatalogsDto, ParameterDto } from '../api/contracts'
import { emptyRuleCatalogs, type ParameterConfiguration } from './parameterRules'
import { getParameterSelectionKey } from './parameterSelectionKey'
type Notifier = { success(message: string): unknown; error(message: string): unknown }
type WorkspaceView =
  | { type: 'closed' }
  | { type: 'selection' }
  | {
      type: 'editor'
      parameterId: string
      selectionKey: string
      source: 'selection' | 'table'
      configuration?: ParameterConfiguration
    }
export function useParameterRulesController(notifier: Notifier, journalId: string) {
  const catalogs = useGetRuleCatalogsQuery(journalId),
    rules = useGetRulesByParameterQuery(journalId)
  const [view, setView] = useState<WorkspaceView>({ type: 'closed' })
  const hasData = Boolean(catalogs.currentData && rules.currentData)
  const rows = useMemo(() => toParameterRows(rules.currentData ?? []), [rules.currentData])
  const catalog = useMemo(
    () => (catalogs.currentData ? toParameterCatalog(catalogs.currentData) : []),
    [catalogs.currentData]
  )
  const editorParameter = useMemo(() => {
    if (view.type !== 'editor') return undefined
    return toEditorParameter(
      rules.currentData?.find((item) => getRulesParameterSelectionKey(item) === view.selectionKey),
      catalog.find((item) => getParameterSelectionKey(item) === view.selectionKey)
    )
  }, [view, rules.currentData, catalog])
  const ruleCatalogs = useMemo(
    () => (catalogs.currentData ? toRuleCatalogs(catalogs.currentData) : emptyRuleCatalogs),
    [catalogs.currentData]
  )
  const isInteractionDisabled =
    catalogs.isFetching || rules.isFetching || catalogs.isError || rules.isError || !hasData
  const { refetch: refetchCatalogs } = catalogs
  const { refetch: refetchRules } = rules
  const reload = useCallback(async (): Promise<[CatalogsDto, ParameterDto[]]> => {
    const results = await Promise.allSettled([refetchCatalogs().unwrap(), refetchRules().unwrap()])
    const [a, b] = results
    if (a.status === 'rejected' || b.status === 'rejected')
      throw new Error('Не удалось обновить данные')
    return [a.value, b.value]
  }, [refetchCatalogs, refetchRules])
  const configurationFor = (
    parameterId: string,
    selectionKey: string,
    catalogData: CatalogsDto,
    parameterData: ParameterDto[]
  ) => {
    const parameter = parameterData.find(
      (item) => getRulesParameterSelectionKey(item) === selectionKey
    )
    return parameter
      ? toParameterConfiguration(parameter, catalogData)
      : { parameterId, selectionKey, defaultValue: null, rules: [] }
  }
  const reloadConfiguration = async (selectionKey: string, parameterId: string) => {
    const [catalogData, parameterData] = await reload()
    return configurationFor(parameterId, selectionKey, catalogData, parameterData)
  }
  const openCreate = () => {
    if (!isInteractionDisabled) setView({ type: 'selection' })
  }
  const openEdit = (selectionKey: string) => {
    if (isInteractionDisabled || !catalogs.currentData || !rules.currentData) return
    const parameter = rules.currentData.find(
      (item) => getRulesParameterSelectionKey(item) === selectionKey
    )
    if (!parameter) return
    const parameterId = parameter.parameters_tech_id
    setView({
      type: 'editor',
      parameterId,
      selectionKey,
      source: 'table',
      configuration: configurationFor(
        parameterId,
        selectionKey,
        catalogs.currentData,
        rules.currentData
      )
    })
  }
  const selectParameter = (selectionKey: string) => {
    if (isInteractionDisabled || !catalogs.currentData || !rules.currentData) return
    const selectedParameter = catalog.find(
      (item) => getParameterSelectionKey(item) === selectionKey
    )
    if (!selectedParameter) return
    const parameterId = selectedParameter.id
    const parameter = rules.currentData.find(
      (item) => getRulesParameterSelectionKey(item) === selectionKey
    )
    setView({
      type: 'editor',
      parameterId,
      selectionKey,
      source: 'selection',
      configuration: parameter
        ? toParameterConfiguration(parameter, catalogs.currentData)
        : undefined
    })
  }
  return {
    rows,
    catalog,
    editorParameter,
    ruleCatalogs,
    isRefreshing: catalogs.isFetching || rules.isFetching,
    isInitialLoading: !hasData && (catalogs.isLoading || rules.isLoading),
    hasInitialLoadError: !hasData && (catalogs.isError || rules.isError),
    hasRefreshError: hasData && (catalogs.isError || rules.isError),
    isInteractionDisabled,
    canCreate: hasData && !isInteractionDisabled,
    view,
    selectParameter,
    openCreate,
    openEdit,
    closeEditor: () => setView({ type: 'closed' }),
    retry: () => {
      void reload().catch(() => notifier.error('Не удалось обновить данные'))
    },
    reloadConfiguration,
    saved: () => {
      notifier.success('Правила сохранены')
      setView({ type: 'closed' })
    }
  }
}
export type ParameterRulesController = ReturnType<typeof useParameterRulesController>
