import type { CatalogItemDto, CatalogsDto, ParameterDto } from './contracts'
import { getParameterSelectionKey } from '../model/parameterSelectionKey'
import type {
  CatalogItem,
  ParameterCatalogItem,
  ParameterConfiguration,
  RuleCatalogs,
  ParameterRow
} from '../model/parameterRules'

type ParameterContextDto = Pick<
  ParameterDto,
  | 'parameters_tech_id'
  | 'plan_types_tech_id'
  | 'aggregation_rules_tech_id'
  | 'aggregation_levels_tech_id'
  | 'shift'
>

export function getRulesParameterSelectionKey(parameter: ParameterContextDto): string {
  return getParameterSelectionKey({
    id: parameter.parameters_tech_id,
    planType: { id: parameter.plan_types_tech_id },
    aggregationRule: { id: parameter.aggregation_rules_tech_id },
    aggregationLevel: { id: parameter.aggregation_levels_tech_id },
    shift: parameter.shift
  })
}

export function toParameterRows(parameters: ParameterDto[]): ParameterRow[] {
  return parameters.map((parameter) => ({
    id: parameter.parameters_tech_id,
    selectionKey: getRulesParameterSelectionKey(parameter),
    name: parameter.name,
    description: parameter.description,
    rulesCount: parameter.rules.length + (parameter.default_rule ? 1 : 0)
  }))
}

export function toParameterCatalog(catalogs: CatalogsDto): ParameterCatalogItem[] {
  const option = (item?: CatalogItemDto | null): CatalogItem | undefined =>
    item ? { id: item.tech_id, name: item.name, description: item.description } : undefined
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

export function toEditorParameter(
  parameter: ParameterDto | undefined,
  catalogParameter: ParameterCatalogItem | undefined
): ParameterCatalogItem | undefined {
  if (!parameter) return catalogParameter

  const option = (id: string, item?: CatalogItem): CatalogItem =>
    item?.id === id ? item : { id, name: id }

  return {
    id: parameter.parameters_tech_id,
    name: parameter.name ?? catalogParameter?.name ?? parameter.parameters_tech_id,
    description:
      parameter.description !== undefined
        ? parameter.description
        : (catalogParameter?.description ?? null),
    planType: option(parameter.plan_types_tech_id, catalogParameter?.planType),
    aggregationRule: option(parameter.aggregation_rules_tech_id, catalogParameter?.aggregationRule),
    aggregationLevel: option(
      parameter.aggregation_levels_tech_id,
      catalogParameter?.aggregationLevel
    ),
    shift: parameter.shift ?? undefined
  }
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
    selectionKey: getRulesParameterSelectionKey(parameter),
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
        aggregationLevelId: parameter.aggregation_levels_tech_id,
        aggregationRuleId: parameter.aggregation_rules_tech_id,
        planTypeId: parameter.plan_types_tech_id,
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
