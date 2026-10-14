import type { ParameterCatalogItem } from './parameterRules'

export function getParameterSelectionKey(parameter: ParameterCatalogItem): string {
  return JSON.stringify([
    parameter.id,
    parameter.planType?.id ?? null,
    parameter.aggregationRule?.id ?? null,
    parameter.aggregationLevel?.id ?? null,
    parameter.shift?.id ?? null
  ])
}
