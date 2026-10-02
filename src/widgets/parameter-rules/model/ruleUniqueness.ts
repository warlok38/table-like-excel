interface RuleIdentity {
  aggregationLevelId?: string
  aggregationRuleId?: string
  planTypeId?: string
  isDefault: boolean
  functionId?: string
  value?: number
}
export function findDuplicateRuleIndexes(parameterId: string | undefined, rules: RuleIdentity[]) {
  const groups = new Map<string, number[]>()
  rules.forEach((rule, index) => {
    if (!parameterId || !rule.aggregationLevelId || !rule.aggregationRuleId || !rule.planTypeId)
      return
    if (!rule.isDefault && (!rule.functionId || !Number.isFinite(rule.value))) return
    const key = JSON.stringify([
      parameterId,
      rule.aggregationLevelId,
      rule.aggregationRuleId,
      rule.planTypeId,
      rule.isDefault,
      ...(rule.isDefault ? [] : [rule.functionId, rule.value])
    ])
    const group = groups.get(key) ?? []
    group.push(index)
    groups.set(key, group)
  })
  return new Set(
    Array.from(groups.values())
      .filter((indexes) => indexes.length > 1)
      .flat()
  )
}
