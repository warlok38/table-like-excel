'use client'

import type { RefObject } from 'react'

import type { CellValue, EditingSession } from '../../model'
import { DateValueEditor } from './DateValueEditor'
import { SelectValueEditor } from './SelectValueEditor'
import { TextValueEditor } from './TextValueEditor'

type CellValueEditorProps = {
  session: EditingSession
  currentValue: CellValue
  anchorRef: RefObject<HTMLElement>
  tableOwnerId: string
  onDraftChange: (draft: string) => void
  onChooseValue: (value: CellValue) => void
  onBlur: () => void
  onCommit: () => void
  onCancel: () => void
  onNavigateByTab: (backward: boolean) => boolean
}

export function CellValueEditor({
  session,
  currentValue,
  anchorRef,
  tableOwnerId,
  onDraftChange,
  onChooseValue,
  onBlur,
  onCommit,
  onCancel,
  onNavigateByTab
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
        onBlur={onBlur}
        onDraftChange={onDraftChange}
        onCommit={onCommit}
        onCancel={onCancel}
        onNavigateByTab={onNavigateByTab}
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
        onNavigateByTab={onNavigateByTab}
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
      onNavigateByTab={onNavigateByTab}
    />
  )
}
