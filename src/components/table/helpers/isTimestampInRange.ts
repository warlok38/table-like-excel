import type { ShiftRange } from '@/types'

export function isTimestampInRange(timestamp: string, shiftJournalInfo: ShiftRange): boolean {
  const timezone = getTimezoneOffsetFromIso(timestamp)
  const timeCell = new Date(timestamp)
  const shiftStart = new Date(
    addTimezoneToIsoDateTime(shiftJournalInfo.shift_start as string, timezone)
  )
  const shiftEnd = new Date(
    addTimezoneToIsoDateTime(shiftJournalInfo.shift_end as string, timezone)
  )
  return timeCell >= shiftStart && timeCell < shiftEnd
}

function getTimezoneOffsetFromIso(value: string): string {
  const match = value.match(/([+-]\d{2}:\d{2}|Z)$/)
  if (!match) {
    throw new Error(`Timezone offset not found in timestamp: ${value}`)
  }
  return match[1]
}

function addTimezoneToIsoDateTime(value: string, timezone: string): string {
  if (hasTimezoneOffset(value)) {
    return value
  }
  return `${value}${timezone}`
}

function hasTimezoneOffset(value: string): boolean {
  return /([+-]\d{2}:\d{2}|Z)$/.test(value)
}
