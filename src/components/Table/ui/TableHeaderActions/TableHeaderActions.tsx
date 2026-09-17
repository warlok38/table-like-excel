'use client'

import type { TableHeaderActionsModel } from '../../model'
import styles from './TableHeaderActions.module.css'

type TableHeaderActionsProps = {
  model: TableHeaderActionsModel
}

const saveLabels: Record<TableHeaderActionsModel['saveStatus'], string> = {
  idle: 'Сохранить',
  saving: 'Сохраняем',
  success: 'Успешно',
  failure: 'Ошибка'
}

export function TableHeaderActions({ model }: TableHeaderActionsProps) {
  const {
    ownerId,
    colors,
    dataStatusActionsEnabled,
    canChangeBackground,
    canSave,
    canCancel,
    isSaving,
    saveStatus,
    applyBackground,
    save,
    cancel
  } = model

  return (
    <div
      className={styles.actions}
      data-saving={isSaving}
      data-table-owner={ownerId}
      data-value-editor-owner={ownerId}
      aria-label="Действия с таблицей"
    >
      {dataStatusActionsEnabled && (
        <div className={styles.backgroundPalette} aria-label="Цвет заливки">
          {colors.map((color) => (
            <button
              key={color.tech_id}
              type="button"
              className={color.value ? styles.backgroundButton : styles.emptyBackgroundButton}
              style={color.value ? { backgroundColor: color.value } : undefined}
              title={color.alias}
              aria-label={`Заливка: ${color.alias}`}
              disabled={!canChangeBackground}
              onClick={() => applyBackground(color.value)}
            />
          ))}
        </div>
      )}
      <div className={styles.saveActions} aria-label="Сохранение изменений">
        <button type="button" className={styles.saveButton} disabled={!canSave} onClick={save}>
          <span aria-live="polite">{saveLabels[saveStatus]}</span>
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          disabled={!canCancel}
          onClick={cancel}
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
