export interface ParameterSelectionIdentity {
  id: string
  planType?: { id: string }
  aggregationRule?: { id: string }
  aggregationLevel?: { id: string }
  shift?: { id: string } | null
}

export function getParameterSelectionKey(parameter: ParameterSelectionIdentity): string {
  return JSON.stringify([
    parameter.id,
    parameter.planType?.id ?? null,
    parameter.aggregationRule?.id ?? null,
    parameter.aggregationLevel?.id ?? null,
    parameter.shift?.id ?? null
  ])
}
