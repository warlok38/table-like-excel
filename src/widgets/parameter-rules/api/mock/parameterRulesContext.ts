import type { CatalogsDto, ParameterDto, RuleInput } from '../contracts'
import { rejectMock } from './mockValidation'

type RuleContext = Pick<
  RuleInput,
  | 'parameters_tech_id'
  | 'journals_tech_id'
  | 'aggregation_levels_tech_id'
  | 'aggregation_rules_tech_id'
  | 'plan_types_tech_id'
>

export function getMockParameterContext(
  input: RuleContext,
  catalogs: CatalogsDto,
  loc: (string | number)[]
): Omit<ParameterDto, 'rules' | 'default_rule'> {
  const candidates = catalogs.parameters.filter((item) => item.tech_id === input.parameters_tech_id)
  if (!candidates.length) rejectMock('Неизвестный параметр', [...loc, 'parameters_tech_id'])
  const matches = candidates.filter(
    (item) =>
      item.aggregation_level?.tech_id === input.aggregation_levels_tech_id &&
      item.aggregation_rule?.tech_id === input.aggregation_rules_tech_id &&
      item.plan_type?.tech_id === input.plan_types_tech_id
  )
  if (!matches.length) rejectMock('Агрегации правила не соответствуют параметру', loc)
  if (matches.length > 1)
    rejectMock('Контракт POST не позволяет однозначно выбрать смену параметра', loc)
  const catalog = matches[0]
  return {
    parameters_tech_id: input.parameters_tech_id,
    journals_tech_id: input.journals_tech_id,
    aggregation_levels_tech_id: input.aggregation_levels_tech_id,
    aggregation_rules_tech_id: input.aggregation_rules_tech_id,
    plan_types_tech_id: input.plan_types_tech_id,
    name: catalog.name,
    description: catalog.description,
    shift: catalog.shift
      ? {
          id: catalog.shift.tech_id,
          name: catalog.shift.name,
          description: catalog.shift.description
        }
      : undefined
  }
}
