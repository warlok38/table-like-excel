import type { CellTable, CellValue } from '@/types'
import type { EditableCellEditor, PendingValues } from './types'

export function getEffectiveValue(
  cellKey: string,
  cell: CellTable,
  pending: PendingValues
): CellValue {
  return Object.prototype.hasOwnProperty.call(pending, cellKey) ? pending[cellKey] : cell.value
}

export function getInitialDraft(value: CellValue, editor: EditableCellEditor): string {
  if (value === null) return ''

  if (editor.type === 'number') {
    return numberToDraft(value)
  }

  return String(value)
}

export function normalizeNumberDraft(candidate: string): string | null {
  const normalized = candidate.replace(/\./g, ',')
  return /^-?\d*(,\d*)?$/.test(normalized) ? normalized : null
}

export function normalizeCommittedValue(draft: string, editor: EditableCellEditor): CellValue {
  if (editor.type === 'text' || editor.type === 'textarea') {
    const text = draft.trim()
    return text === '' ? null : text
  }

  if (editor.type === 'number') {
    if (!/\d/.test(draft)) return null

    const parsed = Number(draft.replace(',', '.'))
    if (!Number.isFinite(parsed)) return null

    let value = parsed
    if (editor.min !== undefined) value = Math.max(editor.min, value)
    if (editor.max !== undefined) value = Math.min(editor.max, value)

    return value === 0 ? 0 : value
  }

  return draft === '' ? null : draft
}

export function formatPendingValue(value: CellValue, editor: EditableCellEditor): string {
  if (value === null) return ''

  if (editor.type === 'select') {
    const option = editor.options.find((item) => item.value === value)
    return option?.label ?? String(value)
  }

  if (editor.type === 'date') {
    const text = String(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return `${text.slice(8, 10)}.${text.slice(5, 7)}.${text.slice(0, 4)}`
    }
    return text
  }

  if (editor.type === 'number') {
    return new Intl.NumberFormat('ru-RU', { maximumSignificantDigits: 21 }).format(Number(value))
  }

  return String(value)
}

function numberToDraft(value: CellValue): string {
  if (typeof value !== 'number') return String(value)
  const text = String(value)

  if (!/[eE]/.test(text)) {
    return text.replace('.', ',')
  }

  const [coefficient, exponentText] = text.toLowerCase().split('e')
  const exponent = Number(exponentText)
  if (!Number.isInteger(exponent)) return text.replace('.', ',')

  const sign = coefficient.startsWith('-') ? '-' : ''
  const unsigned = coefficient.replace('-', '')
  const [integerPart, fractionPart = ''] = unsigned.split('.')
  const digits = `${integerPart}${fractionPart}`
  const decimalIndex = integerPart.length + exponent

  if (decimalIndex <= 0) {
    return `${sign}0,${'0'.repeat(Math.abs(decimalIndex))}${digits}`.replace(/,?0+$/, (match) =>
      match.startsWith(',') ? match : ''
    )
  }

  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${'0'.repeat(decimalIndex - digits.length)}`
  }

  return `${sign}${digits.slice(0, decimalIndex)},${digits.slice(decimalIndex)}`
}
