import type { EditableCellEditor, EditStart } from './editingSession'

export function getInitialCaret(
  start: EditStart,
  draft: string,
  editor: EditableCellEditor
): number {
  if (start.kind !== 'current' || !start.caret) return draft.length
  const { text, offset } = start.caret
  const clamped = Math.max(0, Math.min(offset, text.length))
  if (editor.type === 'textarea') {
    // The native textarea exposes LF offsets even when its value contains CRLF.
    const normalizeLines = (value: string) => value.replace(/\r\n?/g, '\n')
    return normalizeLines(text) === normalizeLines(draft)
      ? normalizeLines(text.slice(0, clamped)).length
      : normalizeLines(draft).length
  }
  if (text === draft) return clamped
  if (editor.type !== 'number') return draft.length

  const normalize = (value: string) => value.replace(/\s/g, '').replace(/\./g, ',')
  if (normalize(text) !== normalize(draft)) return draft.length
  if (clamped === text.length) return draft.length
  const prefixLength = normalize(text.slice(0, clamped)).length
  for (let index = 0; index <= draft.length; index += 1) {
    if (normalize(draft.slice(0, index)).length === prefixLength) return index
  }
  return draft.length
}
