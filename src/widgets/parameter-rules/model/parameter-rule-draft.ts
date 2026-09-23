import {
  getRuleSummary,
  hasRuleStyle,
  type FormattingRule,
  type ParameterConfiguration,
  type RuleOperator
} from './parameter-rules'

export interface DraftRule extends Omit<FormattingRule, 'condition'> {
  uiKey: string
  condition?: {
    operator?: RuleOperator
    value?: number
  }
}

export interface EditorDraft {
  parameterId?: number
  rules: DraftRule[]
}

export interface RuleErrors {
  name?: string
  condition?: string
  style?: string
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
      condition: rule.condition ? { ...rule.condition } : undefined,
      style: { ...rule.style },
      uiKey: `saved-${index}`
    })) ?? []
})

export const toFormattingRules = (rules: DraftRule[]): FormattingRule[] =>
  rules.map(({ uiKey: _uiKey, ...rule }) => {
    const condition =
      !rule.isDefault && rule.condition?.operator && rule.condition.value !== undefined
        ? { operator: rule.condition.operator, value: rule.condition.value }
        : undefined

    return {
      ...rule,
      name: rule.name.trim(),
      description: rule.description?.trim() || undefined,
      condition,
      style: { ...rule.style }
    }
  })

export const isDraftRuleChanged = (rule: DraftRule, initialRule?: DraftRule): boolean => {
  if (!initialRule) return true

  const { uiKey: _ruleUiKey, ...ruleValues } = rule
  const { uiKey: _initialUiKey, ...initialRuleValues } = initialRule

  return JSON.stringify(ruleValues) !== JSON.stringify(initialRuleValues)
}

export const getDraftRuleSummary = (rule: DraftRule) => {
  const condition =
    rule.condition?.operator && rule.condition.value !== undefined
      ? { operator: rule.condition.operator, value: rule.condition.value }
      : undefined
  return getRuleSummary({ ...rule, condition })
}

export const validateEditorDraft = (draft: EditorDraft): DraftErrors => {
  const errors: DraftErrors = { byRule: {} }

  if (!draft.parameterId) errors.parameter = 'Выберите параметр'
  if (draft.rules.length === 0) errors.rules = 'Добавьте хотя бы одно правило'

  draft.rules.forEach((rule) => {
    const ruleErrors: RuleErrors = {}
    if (!rule.name.trim()) ruleErrors.name = 'Введите название правила'
    if (!rule.isDefault && (!rule.condition?.operator || rule.condition.value === undefined)) {
      ruleErrors.condition = 'Укажите условие и значение'
    }
    if (!hasRuleStyle(rule.style)) {
      ruleErrors.style = 'Выберите хотя бы одно свойство оформления'
    }
    if (Object.keys(ruleErrors).length > 0) errors.byRule[rule.uiKey] = ruleErrors
  })

  return errors
}
