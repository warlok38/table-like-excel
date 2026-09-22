export type RuleOperator = '<' | '<=' | '>' | '>=' | '='

export type FontWeight = 'regular' | 'medium' | 'bold'

export interface RuleCondition {
  operator: RuleOperator
  value: number
}

export interface RuleStyle {
  textColor?: string
  backgroundColor?: string
  fontWeight?: FontWeight
}

export interface FormattingRule {
  id?: number
  name: string
  description?: string
  isDefault: boolean
  condition?: RuleCondition
  style: RuleStyle
}

export interface ParameterCatalogItem {
  id: number
  name: string
  description: string
}

export interface ParameterConfiguration {
  parameterId: number
  updatedAt: string
  rules: FormattingRule[]
}

export interface ParameterRulesSnapshot {
  catalog: ParameterCatalogItem[]
  configurations: ParameterConfiguration[]
}

export interface ParameterRulesAdapter {
  load(): Promise<ParameterRulesSnapshot>
  save(
    configuration: Pick<ParameterConfiguration, 'parameterId' | 'rules'>
  ): Promise<ParameterRulesSnapshot>
  delete(parameterId: number): Promise<ParameterRulesSnapshot>
}

export const operatorLabels: Record<RuleOperator, string> = {
  '<': '<',
  '<=': '≤',
  '>': '>',
  '>=': '≥',
  '=': '='
}

export const fontWeightLabels: Record<FontWeight, string> = {
  regular: 'Обычный',
  medium: 'Средний',
  bold: 'Полужирный'
}

export function getRuleSummary(rule: FormattingRule): string {
  let condition = 'Условие не задано'
  if (rule.isDefault) {
    condition = 'По умолчанию'
  } else if (rule.condition) {
    condition = `Значение ${operatorLabels[rule.condition.operator]} ${rule.condition.value}`
  }
  const styles = [
    rule.style.textColor ? 'цвет текста' : null,
    rule.style.backgroundColor ? 'цвет фона' : null,
    rule.style.fontWeight ? fontWeightLabels[rule.style.fontWeight] : null
  ].filter(Boolean)

  return `${condition} → ${styles.length > 0 ? styles.join(', ') : 'оформление не задано'}`
}

export function hasRuleStyle(style: RuleStyle): boolean {
  return Boolean(style.textColor || style.backgroundColor || style.fontWeight)
}
