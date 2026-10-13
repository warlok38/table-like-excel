import type { CSSProperties } from 'react'

import type { CellDisplayMode } from '../TableCell/cellDisplayMode'

export type TableCellContent = {
  text: string
  displayMode: CellDisplayMode
  template: {
    cellClass: string
    cellStyle: CSSProperties
    contentClass: string
  }
}

export function findChangedCellContents(
  contents: ReadonlyMap<string, TableCellContent>,
  previous: ReadonlyMap<string, TableCellContent>
): Set<string> {
  const changedKeys = new Set<string>()
  contents.forEach((content, key) => {
    const cached = previous.get(key)
    if (
      cached?.text !== content.text ||
      cached.displayMode !== content.displayMode ||
      cached.template.cellClass !== content.template.cellClass ||
      cached.template.contentClass !== content.template.contentClass
    ) {
      changedKeys.add(key)
    }
  })
  return changedKeys
}
