import type { RulesApiError } from '../api/contracts'
import type { DraftErrors } from './parameter-rule-draft'
import type { SaveOperation } from './save-operations'
export function toRulesError(error: unknown): RulesApiError {
  if (error && typeof error === 'object' && 'message' in error) {
    const value = error as RulesApiError
    const knownRejection =
      typeof value.status === 'number' &&
      value.status >= 400 &&
      value.status < 500 &&
      value.status !== 408
    return {
      ...value,
      message: String(value.message),
      uncertain: value.uncertain ?? !knownRejection
    }
  }
  return {
    message: 'Не удалось сохранить изменения. Результат запроса неизвестен.',
    uncertain: true
  }
}
export function mapSaveError(error: RulesApiError, operation: SaveOperation): DraftErrors {
  const errors: DraftErrors = { byRule: {} }
  for (const detail of error.detail ?? []) {
    const loc = detail.loc.filter((part) => part !== 'body').join('.')
    const key = Object.keys(operation.sources)
      .sort((a, b) => b.length - a.length)
      .find((path) => loc === path || loc.startsWith(path + '.'))
    if (!key) continue
    const source = operation.sources[key]
    const suffix = loc.slice(key.length).replace(/^\./, '')
    const field = [source.field, suffix].filter(Boolean).join('.')
    const current = errors.byRule[source.uiKey] ?? {}
    errors.byRule[source.uiKey] = {
      ...current,
      server: error.msg ?? error.message,
      fields: { ...current.fields, [field]: error.msg ?? error.message }
    }
  }
  return errors
}
