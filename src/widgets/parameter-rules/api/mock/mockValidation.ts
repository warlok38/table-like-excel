import type { CatalogsDto, ParameterDto, RuleInput, RulesApiError } from '../contracts'
import { getRulesParameterSelectionKey } from '../parameterRulesAdapter'
export function rejectMock(message: string, loc: (string | number)[] = [], status = 422): never {
  throw {
    detail: [{ loc, msg: message, type: 'validation_error' }],
    status
  } satisfies RulesApiError
}
export function validateRule(
  rule: RuleInput,
  catalogs: CatalogsDto,
  parameters: ParameterDto[],
  loc: (string | number)[],
  selectionKey: string,
  ignoreId?: string
) {
  if (!rule.name.trim()) rejectMock('Введите название правила', [...loc, 'name'])
  if (!Number.isFinite(rule.value)) rejectMock('Укажите число', [...loc, 'value'])
  const parameter = catalogs.parameters.find(
    (item) =>
      item.tech_id === rule.parameters_tech_id &&
      item.aggregation_level?.tech_id === rule.aggregation_levels_tech_id &&
      item.aggregation_rule?.tech_id === rule.aggregation_rules_tech_id &&
      item.plan_type?.tech_id === rule.plan_types_tech_id
  )
  if (!parameter) rejectMock('Неизвестный параметр', [...loc, 'parameters_tech_id'])
  const fields = [
    ['aggregation_levels_tech_id', parameter.aggregation_level],
    ['aggregation_rules_tech_id', parameter.aggregation_rule],
    ['plan_types_tech_id', parameter.plan_type]
  ] as const
  fields.forEach(([key, item]) => {
    if (!item?.tech_id || item.tech_id !== rule[key])
      rejectMock('Агрегации правила не соответствуют параметру', [...loc, key])
  })
  if (!catalogs.functions.some((item) => item.functions_tech_id === rule.functions_tech_id))
    rejectMock('Выберите функцию', [...loc, 'functions_tech_id'])
  const duplicate = parameters
    .filter(
      (item) =>
        item.journals_tech_id === rule.journals_tech_id &&
        getRulesParameterSelectionKey(item) === selectionKey
    )
    .flatMap((item) => item.rules)
    .some(
      (item) =>
        item.rules_tech_id !== ignoreId &&
        item.functions_tech_id === rule.functions_tech_id &&
        Number(item.value) === rule.value
    )
  if (duplicate) rejectMock('Правило с таким условием уже существует', loc)
}
