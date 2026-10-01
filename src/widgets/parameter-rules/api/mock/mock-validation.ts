import type { CatalogsDto, ParameterDto, RuleInput, RulesApiError } from '../contracts'
export function rejectMock(message: string, loc: (string | number)[] = [], status = 422): never {
  throw {
    message,
    msg: message,
    type: 'validation_error',
    detail: [{ loc }],
    status
  } satisfies RulesApiError
}
export function validateRule(
  rule: RuleInput,
  catalogs: CatalogsDto,
  parameters: ParameterDto[],
  loc: (string | number)[],
  ignoreId?: string
) {
  if (!rule.name.trim()) rejectMock('Введите название правила', [...loc, 'name'])
  if (!Number.isFinite(rule.value)) rejectMock('Укажите число', [...loc, 'value'])
  const fields = [
    ['parameters_tech_id', catalogs.parameters],
    ['aggregation_levels_tech_id', catalogs.aggregation_levels],
    ['aggregation_rules_tech_id', catalogs.aggregation_rules],
    ['plan_types_tech_id', catalogs.plan_types]
  ] as const
  fields.forEach(([key, items]) => {
    if (!items.some((item) => item.tech_id === rule[key]))
      rejectMock('Неизвестное значение справочника', [...loc, key])
  })
  if (
    !rule.is_default &&
    !catalogs.functions.some((item) => item.functions_tech_id === rule.functions_tech_id)
  )
    rejectMock('Выберите функцию', [...loc, 'functions_tech_id'])
  const duplicate = parameters
    .flatMap((item) => item.rules)
    .some(
      (item) =>
        item.rules_tech_id !== ignoreId &&
        item.parameters_tech_id === rule.parameters_tech_id &&
        item.journals_tech_id === rule.journals_tech_id &&
        item.aggregation_levels_tech_id === rule.aggregation_levels_tech_id &&
        item.aggregation_rules_tech_id === rule.aggregation_rules_tech_id &&
        item.plan_types_tech_id === rule.plan_types_tech_id &&
        item.is_default === rule.is_default &&
        (rule.is_default ||
          (item.functions_tech_id === rule.functions_tech_id && Number(item.value) === rule.value))
    )
  if (duplicate) rejectMock('Правило с таким условием уже существует', loc)
}
