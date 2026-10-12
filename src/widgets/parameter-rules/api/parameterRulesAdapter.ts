import type { CatalogsDto, ParameterDto } from './contracts'
import type {
  ParameterCatalogItem,
  ParameterConfiguration,
  RuleCatalogs,
  ParameterRow
} from '../model/parameterRules'

export function toParameterRows(parameters: ParameterDto[]): ParameterRow[] {
  return parameters.map((parameter) => ({
    id: parameter.parameters_tech_id,
    name: parameter.name,
    description: parameter.description,
    rulesCount: parameter.rules.length
  }))
}

export function toParameterCatalog(catalogs: CatalogsDto): ParameterCatalogItem[] {
  const option = (item?: { tech_id: string; name: string } | null) =>
    item ? { id: item.tech_id, name: item.name } : undefined
  return catalogs.parameters.map((item) => ({
    id: item.tech_id,
    name: item.name,
    description: item.description,
    shift: option(item.shift),
    planType: option(item.plan_type),
    aggregationLevel: option(item.aggregation_level),
    aggregationRule: option(item.aggregation_rule)
  }))
}

export function toRuleCatalogs(catalogs: CatalogsDto): RuleCatalogs {
  return {
    functions: catalogs.functions.map((item) => ({
      id: item.functions_tech_id,
      name: item.name
    })),
    attributes: catalogs.ui_attributes.map((item) => ({
      id: item.ui_attributes_tech_id,
      key: item.attr_key,
      name: item.interface_name
    }))
  }
}

export function toParameterConfiguration(
  parameter: ParameterDto,
  catalogs: CatalogsDto
): ParameterConfiguration {
  return {
    parameterId: parameter.parameters_tech_id,
    defaultRuleId: parameter.default_rule?.id,
    defaultValue: parameter.default_rule?.value ?? null,
    rules: parameter.rules.map((rule) => {
      const related = (item: { rules_tech_id: string; parameters_tech_id: string }) =>
        item.rules_tech_id === rule.rules_tech_id &&
        item.parameters_tech_id === parameter.parameters_tech_id

      return {
        id: rule.rules_tech_id,
        name: rule.name,
        description: rule.description,
        aggregationLevelId: rule.aggregation_levels_tech_id,
        aggregationRuleId: rule.aggregation_rules_tech_id,
        planTypeId: rule.plan_types_tech_id,
        functionId: rule.functions_tech_id ?? undefined,
        scaleId: rule.scales_tech_id,
        value: typeof rule.value === 'string' && !rule.value.trim() ? NaN : Number(rule.value),
        uiRules: catalogs.ui_rules.filter(related).map((item) => ({
          id: item.ui_rules_tech_id,
          ruleId: item.rules_tech_id,
          key: item.attr_key,
          name: item.name,
          label: item.interface_name,
          description: item.description,
          value: item.value
        })),
        notifications: catalogs.notify_rules.filter(related).map((item) => ({
          id: item.rule_notification_tech_id,
          ruleId: item.rules_tech_id,
          text: item.message_template,
          description: item.description,
          channel: item.channel_type,
          recipients: item.reciepient
        }))
      }
    })
  }
}
