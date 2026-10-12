import { makeOffsets, type TableLayoutModel, type TableLayoutSnapshot } from './tableLayout'

export type TableCellContent = { text: string; preserveLines: boolean }

type TextMetrics = {
  font: string
  letterSpacing: string
  wordSpacing: string
  textTransform: string
  tabSize: string
  inset: number
  minWidth: number
}

type CellWidthMeasurement = TableCellContent & {
  width: number
  metrics: TextMetrics
  template: {
    cellClass: string
    cellStyle: string | null
    contentClass: string
  }
}
export type TableColumnMeasurements = Map<string, CellWidthMeasurement>

function readTextMetrics(cell: HTMLTableCellElement, span: HTMLElement): TextMetrics {
  const textStyle = getComputedStyle(span)
  const cellStyle = getComputedStyle(cell)
  return {
    font: textStyle.font,
    letterSpacing: textStyle.letterSpacing,
    wordSpacing: textStyle.wordSpacing,
    textTransform: textStyle.textTransform,
    tabSize: textStyle.tabSize,
    inset:
      parseFloat(cellStyle.paddingLeft) +
      parseFloat(cellStyle.paddingRight) +
      parseFloat(cellStyle.borderLeftWidth) +
      parseFloat(cellStyle.borderRightWidth),
    minWidth: parseFloat(cellStyle.minWidth) || 0
  }
}

function requiredWidth(textWidth: number, metrics: TextMetrics): number {
  // Round upwards so fractional glyph widths cannot clip the last character.
  return Math.ceil(Math.max(metrics.minWidth, textWidth + metrics.inset))
}

export function measureTableColumns(
  table: HTMLTableElement,
  model: TableLayoutModel,
  contents: ReadonlyMap<string, TableCellContent>,
  previous: TableColumnMeasurements = new Map()
): { measurements: TableColumnMeasurements; widths: number[]; changedKeys: Set<string> } {
  const measurements = new Map(previous)
  const changedKeys = new Set<string>()
  const renderedCells = new Map(
    Array.from(table.querySelectorAll<HTMLTableCellElement>('[data-cell-key]')).map((cell) => [
      cell.dataset.cellKey!,
      cell
    ])
  )
  const probes: Array<{
    key: string
    content: TableCellContent
    metrics: TextMetrics
    element: HTMLSpanElement
  }> = []
  const probeContainer = document.createElement('div')
  Object.assign(probeContainer.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    width: 'max-content'
  })

  contents.forEach((content, key) => {
    const cached = previous.get(key)
    if (cached?.text === content.text && cached.preserveLines === content.preserveLines) return
    changedKeys.add(key)
    const cell = renderedCells.get(key)
    const span = cell?.querySelector<HTMLElement>('[data-cell-content] > span')
    if (cell && span) {
      const metrics = readTextMetrics(cell, span)
      measurements.set(key, {
        ...content,
        metrics,
        template: {
          cellClass: cell.className,
          cellStyle: cell.getAttribute('style'),
          contentClass: span.parentElement!.className
        },
        width: requiredWidth(span.getBoundingClientRect().width, metrics)
      })
      return
    }

    // An edited row may have left the virtual window before Save or Cancel.
    // Measure only its text, with the typography retained from the full pass.
    if (!cached) return
    const element = document.createElement('span')
    Object.assign(element.style, {
      display: 'block',
      width: 'max-content',
      font: cached.metrics.font,
      letterSpacing: cached.metrics.letterSpacing,
      wordSpacing: cached.metrics.wordSpacing,
      textTransform: cached.metrics.textTransform,
      tabSize: cached.metrics.tabSize,
      whiteSpace: content.preserveLines ? 'pre' : 'nowrap'
    })
    element.textContent = content.text
    probeContainer.append(element)
    probes.push({ key, content, metrics: cached.metrics, element })
  })

  if (probes.length) {
    table.parentElement?.append(probeContainer)
    probes.forEach(({ key, content, metrics, element }) => {
      measurements.set(key, {
        ...previous.get(key)!,
        ...content,
        metrics,
        width: requiredWidth(element.getBoundingClientRect().width, metrics)
      })
    })
    probeContainer.remove()
  }

  const widths = Array<number>(model.visualColumnCount).fill(0)
  // Single-column cells establish the baseline; merged cells constrain sums.
  model.columnRangeByCellKey.forEach(({ start, end }, key) => {
    if (end - start === 1)
      widths[start] = Math.max(widths[start], measurements.get(key)?.width ?? 0)
  })
  model.columnRangeByCellKey.forEach(({ start, end }, key) => {
    if (end - start <= 1) return
    const current = widths.slice(start, end).reduce((sum, width) => sum + width, 0)
    const deficit = (measurements.get(key)?.width ?? 0) - current
    if (deficit <= 0) return
    const extra = deficit / (end - start)
    for (let column = start; column < end; column += 1) widths[column] += extra
  })
  return { measurements, widths, changedKeys }
}

export function updateTableColumnWidths(
  snapshot: TableLayoutSnapshot,
  widths: number[]
): TableLayoutSnapshot {
  if (widths.every((width, index) => Math.abs(width - snapshot.columnWidths[index]) <= 0.1)) {
    return snapshot
  }
  const offsets = makeOffsets(widths)
  const cellRects = new Map(snapshot.cellRects)
  cellRects.forEach((rect, key) => {
    const range = snapshot.columnRangeByCellKey.get(key)!
    cellRects.set(key, { ...rect, left: offsets[range.start], right: offsets[range.end] })
  })
  return {
    ...snapshot,
    columnWidths: widths,
    totalWidth: offsets[offsets.length - 1] ?? 0,
    cellRects
  }
}
