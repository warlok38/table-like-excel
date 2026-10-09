import type { DraftRule } from './parameterRuleDraft'
import type { ParameterCatalogItem } from './parameterRules'

export function matchesRuleSearch(
  rule: DraftRule,
  parameter: ParameterCatalogItem | undefined,
  query: string
): boolean {
  const words = query.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean)
  const fields = [
    rule.name.trim() || 'Новое правило',
    parameter?.aggregationLevel?.name,
    parameter?.aggregationRule?.name,
    parameter?.planType?.name
  ].map((value) => (value ?? '').toLocaleLowerCase('ru'))

  return words.every((word) => fields.some((field) => field.includes(word)))
}
