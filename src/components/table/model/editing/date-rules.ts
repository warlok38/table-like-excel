export const MIN_YEAR = 1
export const MAX_YEAR = 9999

export function isDateAllowed(iso: string, min?: string, max?: string): boolean {
  if (!isRealIsoDate(iso)) return false
  if (min && iso < min) return false
  if (max && iso > max) return false

  return true
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

export function makeLocalDate(year: number, month: number, day: number): Date {
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}
