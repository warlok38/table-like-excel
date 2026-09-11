'use client'

import { useLayoutEffect, useRef } from 'react'

import { normalizeNumberDraft, type EditingSession } from '../../model'
import styles from './CellValueEditor.module.css'

type TextValueEditorProps = {
  session: EditingSession
  tableOwnerId: string
  onDraftChange: (draft: string) => void
  onCommit: () => void
  onCancel: () => void
}

export function TextValueEditor({
  session,
  tableOwnerId,
  onDraftChange,
  onCommit,
  onCancel
}: TextValueEditorProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const isComposingRef = useRef(false)
  const editor =
    session.editor.type === 'text' ||
    session.editor.type === 'textarea' ||
    session.editor.type === 'number'
      ? session.editor
      : null

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return

    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }, [session.cellKey])

  const applyCandidate = (candidate: string) => {
    if (!editor) return

    if (editor.type === 'number') {
      const normalized = normalizeNumberDraft(candidate)
      if (normalized === null) return
      onDraftChange(normalized)
      return
    }

    onDraftChange(limitText(candidate, editor.maxLength))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }

    if (event.key === 'Enter') {
      if (editor?.type === 'textarea' && event.shiftKey) {
        return
      }

      if (isComposingRef.current || event.nativeEvent.isComposing) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onCommit()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget
    const start = target.selectionStart ?? session.draft.length
    const end = target.selectionEnd ?? session.draft.length
    let text = event.clipboardData.getData('text')

    if (!editor) return

    if (editor.type === 'text') {
      text = text.replace(/\r\n|\r|\n/g, ' ')
    } else if (editor.type === 'textarea') {
      text = text.replace(/\r\n|\r/g, '\n')
    }

    const available =
      editor.type === 'number' || editor.maxLength === undefined
        ? text.length
        : Math.max(0, editor.maxLength - (session.draft.length - (end - start)))
    const inserted = text.slice(0, available)
    const candidate = `${session.draft.slice(0, start)}${inserted}${session.draft.slice(end)}`

    if (editor.type === 'number' && normalizeNumberDraft(candidate) === null) {
      event.preventDefault()
      return
    }

    event.preventDefault()
    applyCandidate(candidate)
    requestAnimationFrame(() => {
      const nextInput = inputRef.current
      const caret = start + inserted.replace(/\./g, ',').length
      nextInput?.setSelectionRange(caret, caret)
    })
  }

  const commonProps = {
    className: styles.textInput,
    value: session.draft,
    'data-table-owner': tableOwnerId,
    'data-value-editor-owner': tableOwnerId,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      applyCandidate(event.target.value),
    onKeyDown: handleKeyDown,
    onPaste: handlePaste,
    onCompositionStart: () => {
      isComposingRef.current = true
    },
    onCompositionEnd: () => {
      isComposingRef.current = false
    },
    onMouseDown: (event: React.MouseEvent) => event.stopPropagation(),
    onPointerDown: (event: React.PointerEvent) => event.stopPropagation()
  }

  if (!editor) return null

  if (editor.type === 'textarea') {
    return (
      <textarea
        {...commonProps}
        ref={(node) => {
          inputRef.current = node
        }}
        rows={3}
        maxLength={editor.maxLength}
      />
    )
  }

  return (
    <input
      {...commonProps}
      ref={(node) => {
        inputRef.current = node
      }}
      type="text"
      inputMode={editor.type === 'number' ? 'decimal' : undefined}
      maxLength={editor.type === 'text' ? editor.maxLength : undefined}
    />
  )
}

function limitText(value: string, maxLength?: number): string {
  if (maxLength === undefined) return value
  return value.slice(0, maxLength)
}
