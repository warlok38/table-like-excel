import type { DraftRule } from './parameter-rule-draft'
import type { RuleCatalogs } from './parameter-rules'

export function matchesRuleSearch(rule: DraftRule, catalogs: RuleCatalogs, query: string): boolean {
  const words = query.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean)
  const fields = [
    rule.name.trim() || 'Новое правило',
    catalogs.aggregationLevels.find((item) => item.id === rule.aggregationLevelId)?.name,
    catalogs.aggregationRules.find((item) => item.id === rule.aggregationRuleId)?.name,
    catalogs.planTypes.find((item) => item.id === rule.planTypeId)?.name
  ].map((value) => (value ?? '').toLocaleLowerCase('ru'))

  return words.every((word) => fields.some((field) => field.includes(word)))
}
