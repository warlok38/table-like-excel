import type { TableStructure } from '../../model'
import type { TableColumnMeasurements } from './tableColumnLayout'
import { expandRowRange, type RowSpanInterval, type TableLayoutSnapshot } from './tableLayout'

export function measureChangedOffscreenRows(
  table: HTMLTableElement,
  structure: TableStructure,
  snapshot: TableLayoutSnapshot,
  measurements: TableColumnMeasurements,
  changedKeys: ReadonlySet<string>,
  renderedRows: ReadonlyMap<number, HTMLTableRowElement>
): Map<number, number> {
  const ranges: RowSpanInterval[] = []
  changedKeys.forEach((key) => {
    const start = snapshot.rowByCellKey.get(key)
    if (start === undefined || renderedRows.has(start)) return
    ranges.push(
      expandRowRange(start, snapshot.rowEndByCellKey.get(key)!, snapshot.rowSpanIntervals)
    )
  })
  ranges.sort((a, b) => a.start - b.start)
  const blocks: RowSpanInterval[] = []
  ranges.forEach((range) => {
    const last = blocks[blocks.length - 1]
    if (last && range.start <= last.end + 1) last.end = Math.max(last.end, range.end)
    else blocks.push({ ...range })
  })
  const heights = new Map<number, number>()
  if (!blocks.length) return heights

  // Recreate only affected rowSpan blocks, without editors, observers or refs.
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none'
  })
  const rowProbes = new Map<number, HTMLTableRowElement>()
  blocks.forEach(({ start, end }) => {
    const probe = table.cloneNode(false) as HTMLTableElement
    probe.style.width = `${snapshot.totalWidth}px`
    probe.style.tableLayout = 'fixed'
    const columns = document.createElement('colgroup')
    snapshot.columnWidths.forEach((width) => {
      const column = document.createElement('col')
      column.style.width = `${width}px`
      columns.append(column)
    })
    probe.append(columns)
    const body = document.createElement('tbody')
    body.className = table.tBodies[0]?.className ?? ''
    for (let rowIndex = start; rowIndex <= end; rowIndex += 1) {
      const row = document.createElement('tr')
      row.className = table.rows[0]?.className ?? ''
      structure.rows[rowIndex].forEach((cell) => {
        const measured = measurements.get(cell.key)!
        const td = document.createElement('td')
        td.className = measured.template.cellClass
        if (measured.template.cellStyle) td.setAttribute('style', measured.template.cellStyle)
        td.colSpan = cell.colSpan
        td.rowSpan = cell.rowSpan
        const content = document.createElement('div')
        content.className = measured.template.contentClass
        content.style.whiteSpace = measured.preserveLines ? 'pre' : 'nowrap'
        const span = document.createElement('span')
        span.textContent = measured.text
        content.append(span)
        td.append(content)
        row.append(td)
      })
      rowProbes.set(rowIndex, row)
      body.append(row)
    }
    probe.append(body)
    container.append(probe)
  })
  table.parentElement?.append(container)
  rowProbes.forEach((row, index) => heights.set(index, row.getBoundingClientRect().height))
  container.remove()
  return heights
}
