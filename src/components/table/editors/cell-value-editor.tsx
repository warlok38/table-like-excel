'use client'

import type { RefObject } from 'react'

import type { CellValue } from '@/types'
import type { EditingSession } from '../editing/types'
import { DateValueEditor } from './date-value-editor'
import { SelectValueEditor } from './select-value-editor'
import { TextValueEditor } from './text-value-editor'

type CellValueEditorProps = {
  session: EditingSession
  currentValue: CellValue
  anchorRef: RefObject<HTMLElement>
  tableOwnerId: string
  onDraftChange: (draft: string) => void
  onChooseValue: (value: CellValue) => void
  onCommit: () => void
  onCancel: () => void
}

export function CellValueEditor({
  session,
  currentValue,
  anchorRef,
  tableOwnerId,
  onDraftChange,
  onChooseValue,
  onCommit,
  onCancel
}: CellValueEditorProps) {
  if (
    session.editor.type === 'text' ||
    session.editor.type === 'textarea' ||
    session.editor.type === 'number'
  ) {
    return (
      <TextValueEditor
        session={session}
        tableOwnerId={tableOwnerId}
        onDraftChange={onDraftChange}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    )
  }

  if (session.editor.type === 'select') {
    return (
      <SelectValueEditor
        session={session}
        currentValue={currentValue}
        tableOwnerId={tableOwnerId}
        onChooseValue={onChooseValue}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    )
  }

  return (
    <DateValueEditor
      session={session}
      currentValue={currentValue}
      anchorRef={anchorRef}
      tableOwnerId={tableOwnerId}
      onChooseValue={onChooseValue}
      onCommit={onCommit}
      onCancel={onCancel}
    />
  )
}
