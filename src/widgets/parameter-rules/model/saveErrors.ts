import type { RulesApiError } from '../api/contracts'
import type { DraftErrors } from './parameterRuleDraft'
import type { SaveOperation } from './saveOperations'
export function mapSaveError(error: RulesApiError, operation: SaveOperation): DraftErrors {
  const errors: DraftErrors = { byRule: {} }
  for (const detail of Array.isArray(error.detail) ? error.detail : []) {
    const message = detail.msg
    const loc = detail.loc.filter((part) => part !== 'body').join('.')
    const key = Object.keys(operation.sources)
      .sort((a, b) => b.length - a.length)
      .find((path) => loc === path || loc.startsWith(path + '.'))
    if (!key) continue
    const source = operation.sources[key]
    if ('target' in source) {
      errors.defaultValue = message
      continue
    }
    const suffix = loc.slice(key.length).replace(/^\./, '')
    const field = [source.field, suffix].filter(Boolean).join('.')
    const current = errors.byRule[source.uiKey] ?? {}
    errors.byRule[source.uiKey] = {
      ...current,
      server: [current.server, message].filter(Boolean).join(' '),
      fields: { ...current.fields, [field]: message }
    }
  }
  return errors
}
