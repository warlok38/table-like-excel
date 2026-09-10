'use client'

import type { AvailableBackgroundColor } from '@/types'
import type { PendingChangeSummary } from './pending/types'
import styles from './table.module.css'

type TableToolbarProps = {
  colors: AvailableBackgroundColor[]
  dataStatusActionsEnabled: boolean
  selectedCount: number
  backgroundEditableSelectedCount: number
  pendingSummary: PendingChangeSummary
  canSaveDraft: boolean
  saveStatus: 'idle' | 'saving' | 'success' | 'failure'
  saveMessage: string | null
  onBackgroundChange: (background: string | null) => void
  onSave: () => void
  onCancel: () => void
}

export function TableToolbar({
  colors,
  dataStatusActionsEnabled,
  selectedCount,
  backgroundEditableSelectedCount,
  pendingSummary,
  canSaveDraft,
  saveStatus,
  saveMessage,
  onBackgroundChange,
  onSave,
  onCancel
}: TableToolbarProps) {
  const hasPendingChanges = pendingSummary.operations > 0

  const isHidden =
    selectedCount === 0 && !hasPendingChanges && !canSaveDraft && saveStatus === 'idle'

  const isSaving = saveStatus === 'saving'
  const isBackgroundDisabled = backgroundEditableSelectedCount === 0 || isSaving
  const arePendingActionsDisabled = (!hasPendingChanges && !canSaveDraft) || isSaving

  return (
    <div
      className={styles.toolbar}
      style={isHidden ? { visibility: 'hidden' } : undefined}
      aria-label="Действия с выбранными ячейками"
    >
      {dataStatusActionsEnabled && (
        <>
          <span className={styles.toolbarSummary}>
            Выбрано {selectedCount}, доступно для заливки {backgroundEditableSelectedCount}
          </span>
          <div className={styles.backgroundPalette} aria-label="Цвет заливки">
            {colors.map((color) => (
              <button
                key={color.tech_id}
                type="button"
                className={color.value ? styles.backgroundButton : styles.emptyBackgroundButton}
                style={color.value ? { backgroundColor: color.value } : undefined}
                title={color.alias}
                aria-label={`Заливка: ${color.alias}`}
                disabled={isBackgroundDisabled}
                onClick={() => onBackgroundChange(color.value)}
              />
            ))}
          </div>
        </>
      )}
      {hasPendingChanges && (
        <span className={styles.pendingSummary}>
          Не сохранено: {pendingSummary.changedCells} яч., {pendingSummary.operations} изм.
        </span>
      )}
      <div className={styles.saveActions} aria-label="Сохранение изменений">
        <button
          type="button"
          className={styles.saveButton}
          disabled={arePendingActionsDisabled}
          onClick={onSave}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          disabled={arePendingActionsDisabled}
          onClick={onCancel}
        >
          Отмена
        </button>
      </div>
      {saveMessage && (
        <span
          className={saveStatus === 'failure' ? styles.saveFailure : styles.saveSuccess}
          role="status"
        >
          {saveMessage}
        </span>
      )}
    </div>
  )
}
