import type { RulesApiError } from '../contracts'
export type MockOperation = 'catalogs' | 'rules' | 'post' | 'put' | 'delete'
type Fault = {
  call?: number
  mode?: 'reject' | 'unknown'
  message?: string
  loc?: (string | number)[]
}
const calls: Record<MockOperation, number> = { catalogs: 0, rules: 0, post: 0, put: 0, delete: 0 }
const scenarios: Record<string, Partial<Record<MockOperation, Fault>>> = {
  'partial-put': { put: { call: 2, loc: ['ui_rules', 0, 'value'] } },
  'partial-delete': { delete: { call: 2 } },
  'post-rejected': { post: { call: 1, loc: ['parameter_rules', 0, 'name'] } },
  'post-unknown': { post: { call: 1, mode: 'unknown' } },
  'refresh-failed': { catalogs: { call: 2 }, rules: { call: 2 } },
  'catalogs-failed': { catalogs: { call: 1 } },
  'rules-failed': { rules: { call: 1 } }
}
/** localStorage['parameter-rules-faults']: { "put": { "call": 2 }, "post": { "mode": "unknown" } } */
export async function beginMockRequest(operation: MockOperation): Promise<Fault | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 350))
  calls[operation]++
  let faults: Partial<Record<MockOperation, Fault>> = {}
  try {
    if (typeof window !== 'undefined') {
      const scenario = new URLSearchParams(window.location.search).get('rulesFault') ?? ''
      faults = {
        ...scenarios[scenario],
        ...JSON.parse(localStorage.getItem('parameter-rules-faults') ?? '{}')
      }
    }
  } catch {
    /* unavailable storage */
  }
  const fault = faults[operation]
  if (!fault || (fault.call !== undefined && calls[operation] !== fault.call)) return
  if (fault.mode === 'unknown') return fault
  const message = fault.message ?? 'Тестовая ошибка операции ' + operation
  throw {
    message,
    msg: message,
    status: 422,
    type: 'validation_error',
    detail: [{ loc: fault.loc ?? [] }]
  } satisfies RulesApiError
}
export function finishMockRequest(fault?: Fault) {
  if (fault?.mode === 'unknown')
    throw {
      message: 'Соединение прервано. Результат записи неизвестен.',
      uncertain: true
    } satisfies RulesApiError
}
