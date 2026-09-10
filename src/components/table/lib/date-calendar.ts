export type CalendarMonth = { year: number; month: number }

export type CalendarDay = { iso: string; day: number; inMonth: boolean }

const MIN_YEAR = 1
const MAX_YEAR = 9999

export function getMonthDays(month: CalendarMonth): CalendarDay[] {
  const firstDay = makeLocalDate(month.year, month.month, 1)
  const firstWeekDay = firstDay.getDay() === 0 ? 7 : firstDay.getDay()
  const start = makeLocalDate(month.year, month.month, 1 - (firstWeekDay - 1))

  return Array.from({ length: 42 }, (_, index) => {
    const date = makeLocalDate(start.getFullYear(), start.getMonth() + 1, start.getDate() + index)
    const year = date.getFullYear()
    const currentMonth = date.getMonth() + 1

    return {
      iso: toIsoDate(year, currentMonth, date.getDate()),
      day: date.getDate(),
      inMonth: year === month.year && currentMonth === month.month
    }
  })
}

export function shiftMonth(month: CalendarMonth, delta: number): CalendarMonth {
  const zeroBasedMonth = month.month - 1 + delta
  const date = makeLocalDate(month.year, zeroBasedMonth + 1, 1)
  const year = Math.min(MAX_YEAR, Math.max(MIN_YEAR, date.getFullYear()))

  if (year === MIN_YEAR && date.getFullYear() < MIN_YEAR) {
    return { year: MIN_YEAR, month: 1 }
  }

  if (year === MAX_YEAR && date.getFullYear() > MAX_YEAR) {
    return { year: MAX_YEAR, month: 12 }
  }

  return { year, month: date.getMonth() + 1 }
}

export function isDateAllowed(iso: string, min?: string, max?: string): boolean {
  if (!isRealIsoDate(iso)) return false
  if (min && iso < min) return false
  if (max && iso > max) return false

  return true
}

export function getMonthFromIso(iso: string | null): CalendarMonth {
  if (iso && isRealIsoDate(iso)) {
    return {
      year: Number(iso.slice(0, 4)),
      month: Number(iso.slice(5, 7))
    }
  }

  const today = new Date()
  return { year: today.getFullYear(), month: today.getMonth() + 1 }
}

export function isRealIsoDate(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1) {
    return false
  }

  const date = makeLocalDate(year, month, day)
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}

function makeLocalDate(year: number, month: number, day: number): Date {
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
