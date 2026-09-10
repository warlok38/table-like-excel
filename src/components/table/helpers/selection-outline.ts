export type SelectionRect = { left: number; right: number; top: number; bottom: number }

// Subtract neighbours from each edge. This also handles partial edges beside
// merged cells and disjoint Ctrl selections without boxing in unselected cells.
export function makeSelectionOutline(rects: SelectionRect[]): string {
  const segments: string[] = []
  const epsilon = 0.1

  rects.forEach((rect, index) => {
    const edges = [
      { horizontal: true, at: rect.top, start: rect.left, end: rect.right, opposite: 'bottom' },
      { horizontal: true, at: rect.bottom, start: rect.left, end: rect.right, opposite: 'top' },
      { horizontal: false, at: rect.left, start: rect.top, end: rect.bottom, opposite: 'right' },
      { horizontal: false, at: rect.right, start: rect.top, end: rect.bottom, opposite: 'left' }
    ] as const

    edges.forEach((edge) => {
      let intervals = [[edge.start, edge.end]]
      rects.forEach((other, otherIndex) => {
        if (index === otherIndex || Math.abs(other[edge.opposite] - edge.at) > epsilon) return
        const start = edge.horizontal ? other.left : other.top
        const end = edge.horizontal ? other.right : other.bottom
        intervals = intervals.flatMap(([a, b]) => {
          if (end <= a + epsilon || start >= b - epsilon) return [[a, b]]
          return [a < start ? [a, start] : [], b > end ? [end, b] : []].filter(
            (part) => part.length === 2
          )
        })
      })
      intervals.forEach(([a, b]) => {
        segments.push(edge.horizontal ? `M${a},${edge.at}H${b}` : `M${edge.at},${a}V${b}`)
      })
    })
  })

  return segments.join(' ')
}
