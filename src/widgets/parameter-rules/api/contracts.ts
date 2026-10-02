export interface CatalogItemDto {
  tech_id: string
  name: string
  description: string | null
}
export interface UiAttributeDto {
  ui_attributes_tech_id: string
  name: string
  description: string | null
  attr_key: { key: string }
  interface_name: string
}
export interface UiInput {
  parameters_tech_id: string
  journals_tech_id: string
  name: string
  attr_key: string
  description: string
  interface_name: string
  value: string
}
export interface NotifyInput {
  parameters_tech_id: string
  journals_tech_id: string
  message_template: string
  description: string
  channel_type?: string
  reciepient?: string[]
}
export interface UiRuleDto extends Omit<UiInput, 'description'> {
  ui_rules_tech_id: string
  rules_tech_id: string
  description: string | null
}
export interface NotifyRuleDto extends Omit<NotifyInput, 'description'> {
  rule_notification_tech_id: string
  rules_tech_id: string
  description: string | null
}
export interface RuleInput {
  name: string
  parameters_tech_id: string
  journals_tech_id: string
  aggregation_levels_tech_id: string
  aggregation_rules_tech_id: string
  plan_types_tech_id: string
  is_default: boolean
  created_by: string
  description: string
  functions_tech_id?: string | null
  value: number
  scales_tech_id?: string | null
}
export interface RuleDto extends Omit<RuleInput, 'value' | 'description'> {
  rules_tech_id: string
  value: string | number
  description: string | null
  prev_rules_tech_id: string | null
  version: number
}
export interface ParameterDto {
  parameters_tech_id: string
  name: string
  description: string | null
  rules: RuleDto[]
}
export interface CatalogsDto {
  aggregation_levels: CatalogItemDto[]
  aggregation_rules: CatalogItemDto[]
  plan_types: CatalogItemDto[]
  parameters: CatalogItemDto[]
  ui_rules: UiRuleDto[]
  notify_rules: NotifyRuleDto[]
  ui_attributes: UiAttributeDto[]
  functions: { functions_tech_id: string; name: string; description: string | null }[]
  scales: { scales_tech_id: string; name: string; description: string | null }[]
  scale_values: {
    scale_values_tech_id: string
    scales_tech_id: string
    name: string
    lower_bound: number
    upper_bound: number
    scale_value: string
    description: string | null
  }[]
}
export interface CreateRulesBody {
  parameter_rules: (RuleInput & { ui_rules: UiInput[]; notify_rules: NotifyInput[] })[]
  ui_rules: (UiInput & { rules_tech_id: string })[]
  notify_rules: (NotifyInput & { rules_tech_id: string })[]
}
export interface UpdateRulesBody {
  parameter_rules: { rules_tech_id: string; name: string; description: string; value: number }[]
  ui_rules: {
    ui_rules_tech_id: string
    name: string
    attr_key: string
    interface_name: string
    value: string
    description: string
  }[]
  notify_rules: {
    rule_notification_tech_id: string
    message_template: string
    description: string
    channel_type?: string
    reciepient?: string[]
  }[]
}
export interface DeleteRulesBody {
  parameter_rules: string[]
  ui_rules: string[]
  notify_rules: string[]
}
export interface RulesApiError {
  message: string
  msg?: string
  type?: string
  detail?: { loc: (string | number)[] }[]
  status?: number
  uncertain?: boolean
}
