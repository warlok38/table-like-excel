import {
  getRuleSummary,
  type FormattingRule,
  type ParameterConfiguration,
  type RuleBase,
  type RuleCatalogs,
  type ParameterCatalogItem,
  type UiResult,
  type NotificationResult
} from './parameterRules'
import { findDuplicateRuleIndexes } from './ruleUniqueness'
export interface DraftRule extends Omit<
  RuleBase,
  'aggregationLevelId' | 'aggregationRuleId' | 'planTypeId' | 'value'
> {
  aggregationLevelId?: string
  aggregationRuleId?: string
  planTypeId?: string
  value?: number
  uiRules: UiResult[]
  notifications: NotificationResult[]
  uiKey: string
}
export interface EditorDraft {
  parameterId?: string
  defaultValue: number | null
  rules: DraftRule[]
}
export interface RuleErrors {
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
export type RuleChange = { field: string } | { collection: 'ui_rules' | 'notify_rules' }

export function clearChangedRuleErrors(
  errors: RuleErrors,
  change: RuleChange,
  nextRule: DraftRule
): RuleErrors {
  const fields = { ...errors.fields }
  const next: RuleErrors = { ...errors, fields }
  delete next.server

  if ('collection' in change) {
    for (const key of Object.keys(fields)) {
      if (key.startsWith(change.collection + '.')) delete fields[key]
    }
  } else {
    const field = change.field
    delete fields[field]
    const apiFields: Record<string, string> = {
      functionId: 'functions_tech_id'
    }
    if (apiFields[field]) delete fields[apiFields[field]]
    if (field in next && field !== 'fields')
      delete next[field as Exclude<keyof RuleErrors, 'fields'>]
    if (field === 'functionId') delete next.condition
    if (field === 'functionId' || field === 'value') delete next.duplicate
  }

  if (nextRule.uiRules.length || nextRule.notifications.length) delete next.result
  if (!Object.keys(fields).length) delete next.fields
  return next
}
export const emptyDraftErrors: DraftErrors = { byRule: {} }
export const createEmptyRule = (uiKey: string, parameter?: ParameterCatalogItem): DraftRule => ({
  uiKey,
  name: '',
  description: '',
  aggregationLevelId: parameter?.aggregationLevel?.id,
  aggregationRuleId: parameter?.aggregationRule?.id,
  planTypeId: parameter?.planType?.id,
  uiRules: [],
  notifications: []
})
export const makeEditorDraft = (configuration?: ParameterConfiguration): EditorDraft => ({
  parameterId: configuration?.parameterId,
  defaultValue: configuration?.defaultValue ?? null,
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
export const getDraftRuleSummary = (rule: DraftRule, catalogs: RuleCatalogs) =>
  Number.isFinite(rule.value)
    ? getRuleSummary(toFormattingRules([rule])[0], catalogs)
    : 'Условие не задано'
export const validateEditorDraft = (
  draft: EditorDraft,
  catalogs: RuleCatalogs,
  parameter?: ParameterCatalogItem
): DraftErrors => {
  const errors: DraftErrors = { byRule: {} }
  if (!draft.parameterId) errors.parameter = 'Выберите параметр'
  if (
    draft.rules.some((rule) => !rule.id) &&
    (!parameter?.aggregationLevel?.id || !parameter.aggregationRule?.id || !parameter.planType?.id)
  )
    errors.rules =
      'Для параметра не заданы уровень агрегации, правило агрегации или тип плана. Сохранение нового правила недоступно.'
  const duplicates = findDuplicateRuleIndexes(draft.parameterId, draft.rules)
  draft.rules.forEach((rule, index) => {
    const next: RuleErrors = {}
    if (duplicates.has(index))
      next.duplicate = 'Правило с таким сочетанием агрегаций и условием уже существует'
    if (!Number.isFinite(rule.value)) next.value = 'Укажите число'
    if (!rule.name.trim()) next.name = 'Введите название правила'
    if (!rule.id && !catalogs.functions.some((item) => item.id === rule.functionId))
      next.condition = 'Выберите функцию'
    const fields: Record<string, string> = {}
    rule.uiRules.forEach((item, i) => {
      if (!item.value.trim()) fields['ui_rules.' + i + '.value'] = 'Введите значение'
    })
    rule.notifications.forEach((item, i) => {
      if (!item.text.trim()) fields['notify_rules.' + i + '.message_template'] = 'Введите текст'
    })
    if (Object.keys(fields).length) next.fields = fields
    if (!rule.uiRules.length && !rule.notifications.length)
      next.result = 'Добавьте хотя бы один результат правила'
    if (Object.keys(next).length) errors.byRule[rule.uiKey] = next
  })
  return errors
}
