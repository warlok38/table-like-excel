export type CellValue = string | number | null

export type CellSelectOption = {
  value: string
  label: string
}

export type CellEditor =
  | { type: 'text'; maxLength?: number }
  | { type: 'textarea'; maxLength?: number }
  | { type: 'number'; min?: number; max?: number; step?: number }
  | { type: 'select'; options: CellSelectOption[] }
  | { type: 'date'; min?: string; max?: string; displayFormat?: 'DD.MM.YYYY' }
  | { type: 'readonly' }

export type CellPermissions = {
  value?: boolean
  background?: boolean
  note?: boolean
}

export type CellCapabilities = {
  canEditValue: boolean
  canChangeBackground: boolean
  canEditNote: boolean
  isLocked: boolean
}
