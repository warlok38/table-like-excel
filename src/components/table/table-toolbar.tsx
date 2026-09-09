'use client'

import type { AvailableBackgroundColor } from '@/types'
import styles from './table.module.css'

type TableToolbarProps = {
  colors: AvailableBackgroundColor[]
  selectedCount: number
  backgroundEditableSelectedCount: number
  onBackgroundChange: (background: string | null) => void
}

export function TableToolbar({
  colors,
  selectedCount,
  backgroundEditableSelectedCount,
  onBackgroundChange
}: TableToolbarProps) {
  if (selectedCount === 0) {
    return null
  }

  const isDisabled = backgroundEditableSelectedCount === 0

  return (
    <div className={styles.toolbar} aria-label="Действия с выбранными ячейками">
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
            disabled={isDisabled}
            onClick={() => onBackgroundChange(color.value)}
          />
        ))}
      </div>
    </div>
  )
}
