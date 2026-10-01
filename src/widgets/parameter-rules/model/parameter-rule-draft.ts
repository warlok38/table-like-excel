import {
  getRuleSummary,
  type FormattingRule,
  type ParameterConfiguration,
  type RuleBase,
  type RuleCatalogs,
  type UiResult,
  type NotificationResult
} from './parameter-rules'
import { findDuplicateRuleIndexes } from './rule-uniqueness'
export interface DraftRule extends Omit<
  RuleBase,
  'aggregationLevelId' | 'aggregationRuleId' | 'planTypeId' | 'value'
> {
  aggregationLevelId?: string
  aggregationRuleId?: string
  planTypeId?: string
  value?: number
  isDefault: boolean
  uiRules: UiResult[]
  notifications: NotificationResult[]
  uiKey: string
}
export interface EditorDraft {
  parameterId?: string
  rules: DraftRule[]
}
export interface RuleErrors {
  aggregationLevelId?: string
  aggregationRuleId?: string
  planTypeId?: string
  value?: string
  duplicate?: string
  name?: string
  condition?: string
  result?: string
  server?: string
  fields?: Record<string, string>
}
export interface DraftErrors {
  parameter?: string
  rules?: string
  byRule: Record<string, RuleErrors>
}
export const emptyDraftErrors: DraftErrors = { byRule: {} }
export const createEmptyRule = (uiKey: string): DraftRule => ({
  uiKey,
  name: '',
  description: '',
  isDefault: false,
  uiRules: [],
  notifications: []
})
export const makeEditorDraft = (configuration?: ParameterConfiguration): EditorDraft => ({
  parameterId: configuration?.parameterId,
  rules:
    configuration?.rules.map((rule) => ({
      ...structuredClone(rule),
      uiKey: rule.id!,
      description: rule.description ?? ''
    })) ?? []
})
export const toFormattingRules = (rules: DraftRule[]): FormattingRule[] =>
  rules.map(({ uiKey: _key, ...rule }) => ({
    ...rule,
    aggregationLevelId: rule.aggregationLevelId!,
    aggregationRuleId: rule.aggregationRuleId!,
    planTypeId: rule.planTypeId!,
    value: rule.value!,
    name: rule.name.trim(),
    description: rule.description?.trim() ?? '',
    uiRules: rule.uiRules.map((item) => ({ ...item, value: item.value.trim() })),
    notifications: rule.notifications.map((item) => ({ ...item, text: item.text.trim() }))
  }))
export const isDraftRuleChanged = (rule: DraftRule, initialRule?: DraftRule): boolean => {
  if (!initialRule) return true
  const { uiKey: _a, ...a } = rule
  const { uiKey: _b, ...b } = initialRule
  return JSON.stringify(a) !== JSON.stringify(b)
}
export const getDraftRuleSummary = (rule: DraftRule, catalogs: RuleCatalogs) => {
  const context = [
    catalogs.aggregationLevels.find((item) => item.id === rule.aggregationLevelId)?.name,
    catalogs.aggregationRules.find((item) => item.id === rule.aggregationRuleId)?.name,
    catalogs.planTypes.find((item) => item.id === rule.planTypeId)?.name
  ]
    .filter(Boolean)
    .join(' / ')
  const summary = Number.isFinite(rule.value)
    ? getRuleSummary(toFormattingRules([rule])[0], catalogs)
    : 'Условие не задано'
  return [context, summary].filter(Boolean).join(' · ')
}
export const validateEditorDraft = (draft: EditorDraft, catalogs: RuleCatalogs): DraftErrors => {
  const errors: DraftErrors = { byRule: {} }
  if (!draft.parameterId) errors.parameter = 'Выберите параметр'
  const duplicates = findDuplicateRuleIndexes(draft.parameterId, draft.rules)
  draft.rules.forEach((rule, index) => {
    const next: RuleErrors = {}
    for (const [field, items] of [
      ['aggregationLevelId', catalogs.aggregationLevels],
      ['aggregationRuleId', catalogs.aggregationRules],
      ['planTypeId', catalogs.planTypes]
    ] as const) {
      if (!rule.id && !items.some((item) => item.id === rule[field]))
        next[field] = 'Выберите значение'
    }
    if (duplicates.has(index))
      next.duplicate = 'Правило с таким сочетанием агрегаций и условием уже существует'
    if (!Number.isFinite(rule.value)) next.value = 'Укажите число'
    if (!rule.name.trim()) next.name = 'Введите название правила'
    if (
      !rule.isDefault &&
      !rule.id &&
      !catalogs.functions.some((item) => item.id === rule.functionId)
    )
      next.condition = 'Выберите функцию'
    const fields: Record<string, string> = {}
    rule.uiRules.forEach((item, i) => {
      if (!item.value.trim()) fields['ui_rules.' + i + '.value'] = 'Введите значение'
    })
    rule.notifications.forEach((item, i) => {
      if (!item.text.trim()) fields['notify_rules.' + i + '.message_template'] = 'Введите текст'
    })
    if (Object.keys(fields).length) next.fields = fields
    if (!rule.isDefault && !rule.uiRules.length && !rule.notifications.length)
      next.result = 'Добавьте хотя бы один результат правила'
    if (Object.keys(next).length) errors.byRule[rule.uiKey] = next
  })
  return errors
}
