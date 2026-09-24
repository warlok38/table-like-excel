import { getCellCapabilities, type CellTable } from '@/components/Table'

export function addRequiredNoteAfterValueChangeMock(data: CellTable[][]): CellTable[][] {
  return data.map((row) =>
    row.map((cell) => {
      const capabilities = getCellCapabilities(cell)

      if (!capabilities.canEditValue || !capabilities.canEditNote) {
        return cell
      }

      return {
        ...cell,
        data_status: {
          ...(cell.data_status ?? {}),
          requiresNoteAfterValueChange: true
        }
      }
    })
  )
}
