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

export type SaveParameterInput = Pick<ParameterConfiguration, 'parameterId' | 'rules'>

export interface ParameterRow {
  id: number
  name: string
  description: string
  updatedAt: string
  rulesCount: number
  configuration: ParameterConfiguration
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

export function getParameterRows(snapshot: ParameterRulesSnapshot): ParameterRow[] {
  const catalogById = new Map(snapshot.catalog.map((parameter) => [parameter.id, parameter]))

  return snapshot.configurations.flatMap((configuration) => {
    const parameter = catalogById.get(configuration.parameterId)
    if (!parameter) return []

    return [
      {
        id: parameter.id,
        name: parameter.name,
        description: parameter.description,
        updatedAt: configuration.updatedAt,
        rulesCount: configuration.rules.length,
        configuration
      }
    ]
  })
}
