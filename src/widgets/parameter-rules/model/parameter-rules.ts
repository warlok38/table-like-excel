export interface UiResult {
  id?: string
  ruleId?: string
  key: string
  name: string
  label: string
  description: string
  value: string
  active?: boolean
}
export interface NotificationResult {
  id?: string
  ruleId?: string
  text: string
  description: string
  channel?: string
  recipients?: string[]
  active?: boolean
}
export interface RuleBase {
  id?: string
  name: string
  description?: string
  aggregationLevelId: string
  aggregationRuleId: string
  planTypeId: string
  value: number
  functionId?: string
  scaleId?: string | null
  active?: boolean
}
export interface FormattingRule extends RuleBase {
  isDefault: boolean
  uiRules: UiResult[]
  notifications: NotificationResult[]
}
export interface RuleCatalogs {
  aggregationLevels: { id: string; name: string }[]
  aggregationRules: { id: string; name: string }[]
  planTypes: { id: string; name: string }[]
  functions: { id: string; name: string }[]
  attributes: { id: string; key: string; name: string }[]
}
export const emptyRuleCatalogs: RuleCatalogs = {
  aggregationLevels: [],
  aggregationRules: [],
  planTypes: [],
  functions: [],
  attributes: []
}
export interface ParameterCatalogItem {
  id: string
  name: string
  description: string
}
export interface ParameterConfiguration {
  parameterId: string
  rules: FormattingRule[]
}
export interface ParameterRulesSnapshot {
  ruleCatalogs: RuleCatalogs
  catalog: ParameterCatalogItem[]
  configurations: ParameterConfiguration[]
}
export type SaveParameterInput = ParameterConfiguration
export interface ParameterRow {
  id: string
  name: string
  description: string
  rulesCount: number
  configuration: ParameterConfiguration
}
export function getRuleSummary(rule: FormattingRule, catalogs: RuleCatalogs): string {
  if (rule.isDefault) return 'По умолчанию: ' + rule.value
  const fn =
    catalogs.functions.find((item) => item.id === rule.functionId)?.name ?? 'Неизвестная функция'
  return (
    fn +
    ': ' +
    rule.value +
    ' → ' +
    ([
      ...rule.uiRules.map((item) => item.label),
      ...rule.notifications.map(() => 'уведомление')
    ].join(', ') || 'результат не задан')
  )
}
export function getParameterRows(snapshot: ParameterRulesSnapshot): ParameterRow[] {
  return snapshot.configurations.map((configuration) => {
    const parameter = snapshot.catalog.find((item) => item.id === configuration.parameterId)
    return {
      id: configuration.parameterId,
      name: parameter?.name ?? configuration.parameterId,
      description: parameter?.description ?? '',
      rulesCount: configuration.rules.length,
      configuration
    }
  })
}
