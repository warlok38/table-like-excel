import {
  getRuleSummary,
  hasRuleResult,
  type FormattingRule,
  type ParameterConfiguration,
  type RuleBase,
  type RuleStyle,
  type RuleCatalogs,
  type RuleOperator
} from './parameter-rules'
import { findDuplicateRuleIndexes } from './rule-uniqueness'

export interface DraftRule extends Omit<
  RuleBase,
  'aggregationLevelId' | 'aggregationRuleId' | 'planTypeId' | 'value'
> {
  aggregationLevelId?: string
  aggregationRuleId?: string
  planTypeId?: string
  isDefault: boolean
  value?: number
  operator?: RuleOperator
  style: RuleStyle
  notificationText?: string
  uiKey: string
}

export interface EditorDraft {
  parameterId?: number
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
  style: {}
})

export const makeEditorDraft = (configuration?: ParameterConfiguration): EditorDraft => ({
  parameterId: configuration?.parameterId,
  rules:
    configuration?.rules.map((rule, index) => ({
      ...rule,
      description: rule.description ?? '',
      style: !rule.isDefault ? { ...rule.style } : {},
      uiKey: `saved-${index}`
    })) ?? []
})

export const toFormattingRules = (rules: DraftRule[]): FormattingRule[] =>
  rules.map((rule) => {
    const base: RuleBase = {
      id: rule.id,
      name: rule.name.trim(),
      description: rule.description?.trim() || undefined,
      aggregationLevelId: rule.aggregationLevelId!,
      aggregationRuleId: rule.aggregationRuleId!,
      planTypeId: rule.planTypeId!,
      value: rule.value!
    }
    return rule.isDefault
      ? { ...base, isDefault: true }
      : {
          ...base,
          isDefault: false,
          operator: rule.operator!,
          style: { ...rule.style },
          notificationText: rule.notificationText?.trim() || undefined
        }
  })

export const isDraftRuleChanged = (rule: DraftRule, initialRule?: DraftRule): boolean => {
  if (!initialRule) return true

  const { uiKey: _ruleUiKey, ...ruleValues } = rule
  const { uiKey: _initialUiKey, ...initialRuleValues } = initialRule

  return JSON.stringify(ruleValues) !== JSON.stringify(initialRuleValues)
}

export const getDraftRuleSummary = (rule: DraftRule, catalogs: RuleCatalogs) => {
  const context = [
    catalogs.aggregationLevels.find((item) => item.id === rule.aggregationLevelId)?.name,
    catalogs.aggregationRules.find((item) => item.id === rule.aggregationRuleId)?.name,
    catalogs.planTypes.find((item) => item.id === rule.planTypeId)?.name
  ]
    .filter(Boolean)
    .join(' / ')
  let summary = rule.isDefault
    ? 'По умолчанию: ' + (rule.value ?? 'не задано')
    : 'Условие не задано'
  if (!rule.isDefault && rule.operator && Number.isFinite(rule.value)) {
    summary = getRuleSummary(toFormattingRules([rule])[0])
  }
  return [context, summary].filter(Boolean).join(' · ')
}

export const validateEditorDraft = (draft: EditorDraft, catalogs: RuleCatalogs): DraftErrors => {
  const errors: DraftErrors = { byRule: {} }

  if (!draft.parameterId) errors.parameter = 'Выберите параметр'
  if (draft.rules.length === 0) errors.rules = 'Добавьте хотя бы одно правило'

  const duplicates = findDuplicateRuleIndexes(draft.parameterId, draft.rules)
  draft.rules.forEach((rule, index) => {
    const ruleErrors: RuleErrors = {}
    if (!catalogs.aggregationLevels.some((item) => item.id === rule.aggregationLevelId))
      ruleErrors.aggregationLevelId = 'Выберите уровень агрегации'
    if (!catalogs.aggregationRules.some((item) => item.id === rule.aggregationRuleId))
      ruleErrors.aggregationRuleId = 'Выберите правило агрегации'
    if (!catalogs.planTypes.some((item) => item.id === rule.planTypeId))
      ruleErrors.planTypeId = 'Выберите тип плана'
    if (duplicates.has(index))
      ruleErrors.duplicate = 'Правило с таким сочетанием агрегаций и условием уже существует'
    if (!Number.isFinite(rule.value))
      ruleErrors.value = rule.isDefault ? 'Введите значение по умолчанию' : 'Укажите значение'
    if (!rule.name.trim()) ruleErrors.name = 'Введите название правила'
    if (!rule.isDefault && !rule.operator) {
      ruleErrors.condition = 'Выберите оператор условия'
    }
    const isBlank = (value: string | undefined) => value !== undefined && !value.trim()
    const hasEmptyResult =
      isBlank(rule.style.textColor) ||
      isBlank(rule.style.backgroundColor) ||
      isBlank(rule.notificationText)
    if (!rule.isDefault && hasEmptyResult) {
      ruleErrors.result = 'Заполните добавленные свойства'
    } else if (!rule.isDefault && !hasRuleResult(rule)) {
      ruleErrors.result = 'Добавьте хотя бы один результат правила'
    }
    if (Object.keys(ruleErrors).length > 0) errors.byRule[rule.uiKey] = ruleErrors
  })

  return errors
}
