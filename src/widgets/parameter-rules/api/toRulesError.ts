import type { RulesApiError } from './contracts'

export function toRulesError(
  error: unknown,
  fallback = 'Не удалось сохранить изменения. Результат запроса неизвестен.'
): RulesApiError & { message: string } {
  if (
    error &&
    typeof error === 'object' &&
    ('detail' in error || 'msg' in error || 'message' in error)
  ) {
    const value = error as RulesApiError
    const details = Array.isArray(value.detail) ? value.detail : []
    const message =
      typeof value.detail === 'string'
        ? value.detail
        : details.map((item) => item.msg).join(' ') || value.msg || value.message || fallback
    const knownRejection =
      typeof value.status === 'number' &&
      value.status >= 400 &&
      value.status < 500 &&
      value.status !== 408
    return {
      ...value,
      msg: message,
      message,
      uncertain: value.uncertain ?? !knownRejection
    }
  }
  return { message: fallback, uncertain: true }
}
