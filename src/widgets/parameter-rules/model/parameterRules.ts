export interface UiResult {
  id?: string
  ruleId?: string
  key: string
  name: string
  label: string
  description: string | null
  value: string
}
export interface NotificationResult {
  id?: string
  ruleId?: string
  text: string
  description: string | null
  channel?: string
  recipients?: string[]
}
export interface RuleBase {
  id?: string
  name: string
  description?: string | null
  aggregationLevelId: string
  aggregationRuleId: string
  planTypeId: string
  value: number
  functionId?: string
  scaleId?: string | null
}
export interface FormattingRule extends RuleBase {
  isDefault: boolean
  uiRules: UiResult[]
  notifications: NotificationResult[]
}
export interface RuleCatalogs {
  functions: { id: string; name: string }[]
  attributes: { id: string; key: string; name: string }[]
}
export const emptyRuleCatalogs: RuleCatalogs = {
  functions: [],
  attributes: []
}
export interface ParameterCatalogItem {
  id: string
  name: string
  description: string | null
  shift?: { id: string; name: string }
  planType?: { id: string; name: string }
  aggregationLevel?: { id: string; name: string }
  aggregationRule?: { id: string; name: string }
}
export interface ParameterConfiguration {
  parameterId: string
  rules: FormattingRule[]
}
export type SaveParameterInput = ParameterConfiguration
export interface ParameterRow {
  id: string
  name: string
  description: string | null
  rulesCount: number
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
