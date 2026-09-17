'use client'

import { useMemo, useState, type RefObject } from 'react'

import { isDateAllowed, type CellValue, type EditingSession } from '../../model'
import { getMonthDays, getMonthFromIso, shiftMonth, type CalendarMonth } from './dateCalendar'
import { EditorPopover } from './EditorPopover'
import styles from './CellValueEditor.module.css'

type DateValueEditorProps = {
  session: EditingSession
  currentValue: CellValue
  anchorRef: RefObject<HTMLElement>
  tableOwnerId: string
  onChooseValue: (value: CellValue) => void
  onCommit: () => void
  onCancel: () => void
  onNavigateByTab: (backward: boolean) => boolean
}

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

export function DateValueEditor({
  session,
  currentValue,
  anchorRef,
  tableOwnerId,
  onChooseValue,
  onCommit,
  onCancel,
  onNavigateByTab
}: DateValueEditorProps) {
  const editor = session.editor.type === 'date' ? session.editor : null
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() =>
    getMonthFromIso(typeof currentValue === 'string' ? currentValue : null)
  )
  const days = useMemo(() => getMonthDays(visibleMonth), [visibleMonth])

  if (!editor) return null

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      const didMove = onNavigateByTab(event.shiftKey)
      if (didMove) {
        event.preventDefault()
        event.stopPropagation()
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      onCommit()
    }
  }

  const chooseDate = (iso: string) => {
    if (!isDateAllowed(iso, editor.min, editor.max)) return
    onChooseValue(iso)
    const month = getMonthFromIso(iso)
    if (month.year !== visibleMonth.year || month.month !== visibleMonth.month) {
      setVisibleMonth(month)
    }
  }

  const monthTitleDate = new Date(0)
  monthTitleDate.setFullYear(visibleMonth.year, visibleMonth.month - 1, 1)
  monthTitleDate.setHours(0, 0, 0, 0)

  return (
    <EditorPopover anchorRef={anchorRef} tableOwnerId={tableOwnerId}>
      <div className={styles.panel} onKeyDown={handleKeyDown}>
        <div className={styles.hint}>Пробел - выбрать · Enter - закрыть · Esc - отменить</div>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.navButton}
            disabled={visibleMonth.year === 1 && visibleMonth.month === 1}
            aria-label="Предыдущий месяц"
            onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
          >
            ‹
          </button>
          <div className={styles.monthTitle}>{monthFormatter.format(monthTitleDate)}</div>
          <button
            type="button"
            className={styles.navButton}
            disabled={visibleMonth.year === 9999 && visibleMonth.month === 12}
            aria-label="Следующий месяц"
            onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
          >
            ›
          </button>
        </div>
        <div className={styles.calendarGrid}>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekDay}>
              {day}
            </div>
          ))}
          {days.map((day) => (
            <button
              key={day.iso}
              type="button"
              className={styles.dayButton}
              data-outside-month={!day.inMonth}
              aria-pressed={currentValue === day.iso}
              disabled={!isDateAllowed(day.iso, editor.min, editor.max)}
              onClick={() => chooseDate(day.iso)}
            >
              {day.day}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.clearButton}
          aria-pressed={currentValue === null}
          onClick={() => onChooseValue(null)}
        >
          Очистить
        </button>
      </div>
    </EditorPopover>
  )
}
