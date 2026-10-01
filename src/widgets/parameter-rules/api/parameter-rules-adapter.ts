import type { CatalogsDto, ParameterDto } from './contracts'
import type { ParameterRulesSnapshot } from '../model/parameter-rules'

export function toSnapshot(
  catalogs: CatalogsDto,
  parameters: ParameterDto[],
  journalId: string
): ParameterRulesSnapshot {
  const options = (items: CatalogsDto['parameters']) =>
    items.map((item) => ({ id: item.tech_id, name: item.name }))
  const catalog = new Map(
    catalogs.parameters.map((item) => [
      item.tech_id,
      { id: item.tech_id, name: item.name, description: item.description ?? '' }
    ])
  )
  parameters.forEach((item) =>
    catalog.set(item.parameters_tech_id, {
      id: item.parameters_tech_id,
      name: item.name,
      description: item.description ?? ''
    })
  )
  return {
    catalog: Array.from(catalog.values()),
    ruleCatalogs: {
      aggregationLevels: options(catalogs.aggregation_levels),
      aggregationRules: options(catalogs.aggregation_rules),
      planTypes: options(catalogs.plan_types),
      functions: catalogs.functions.map((item) => ({
        id: item.functions_tech_id,
        name: item.name
      })),
      attributes: catalogs.ui_attributes
        .filter((item) => item.is_active)
        .map((item) => ({
          id: item.ui_attributes_tech_id,
          key: item.attr_key.key,
          name: item.interface_name
        }))
    },
    configurations: parameters.map((parameter) => ({
      parameterId: parameter.parameters_tech_id,
      rules: parameter.rules
        .filter(
          (rule) =>
            rule.journals_tech_id === journalId &&
            rule.parameters_tech_id === parameter.parameters_tech_id
        )
        .map((rule) => {
          const related = (item: {
            rules_tech_id: string
            parameters_tech_id: string
            journals_tech_id: string
          }) =>
            item.rules_tech_id === rule.rules_tech_id &&
            item.parameters_tech_id === parameter.parameters_tech_id &&
            item.journals_tech_id === journalId
          return {
            id: rule.rules_tech_id,
            name: rule.name,
            description: rule.description ?? '',
            aggregationLevelId: rule.aggregation_levels_tech_id,
            aggregationRuleId: rule.aggregation_rules_tech_id,
            planTypeId: rule.plan_types_tech_id,
            isDefault: rule.is_default,
            functionId: rule.functions_tech_id ?? undefined,
            scaleId: rule.scales_tech_id,
            active: rule.is_active,
            value: typeof rule.value === 'string' && !rule.value.trim() ? NaN : Number(rule.value),
            uiRules: catalogs.ui_rules.filter(related).map((item) => ({
              id: item.ui_rules_tech_id,
              ruleId: item.rules_tech_id,
              key: item.attr_key,
              name: item.name,
              label: item.interface_name,
              description: item.description ?? '',
              value: item.value,
              active: item.is_active
            })),
            notifications: catalogs.notify_rules.filter(related).map((item) => ({
              id: item.rule_notification_tech_id,
              ruleId: item.rules_tech_id,
              text: item.message_template,
              description: item.description ?? '',
              channel: item.channel_type,
              recipients: item.reciepient,
              active: item.is_active
            }))
          }
        })
    }))
  }
}
