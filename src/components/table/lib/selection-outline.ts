export type SelectionRect = { left: number; right: number; top: number; bottom: number }

type Side = {
  axis: 'horizontal' | 'vertical'
  at: number
  start: number
  end: number
  facing: 'top' | 'bottom' | 'left' | 'right'
}

const epsilon = 0.1

// Subtract neighbours from each edge. This also handles partial edges beside
// merged cells and disjoint Ctrl selections without boxing in unselected cells.
export function makeSelectionOutline(rects: SelectionRect[]): string {
  const sides = rects.flatMap(rectToSides)
  const horizontalTop = sides.filter((side) => side.facing === 'top')
  const horizontalBottom = sides.filter((side) => side.facing === 'bottom')
  const verticalLeft = sides.filter((side) => side.facing === 'left')
  const verticalRight = sides.filter((side) => side.facing === 'right')
  const segments: string[] = []

  appendVisibleSegments(segments, horizontalTop, horizontalBottom)
  appendVisibleSegments(segments, horizontalBottom, horizontalTop)
  appendVisibleSegments(segments, verticalLeft, verticalRight)
  appendVisibleSegments(segments, verticalRight, verticalLeft)

  return segments.join(' ')
}

function rectToSides(rect: SelectionRect): Side[] {
  return [
    { axis: 'horizontal', at: rect.top, start: rect.left, end: rect.right, facing: 'top' },
    { axis: 'horizontal', at: rect.bottom, start: rect.left, end: rect.right, facing: 'bottom' },
    { axis: 'vertical', at: rect.left, start: rect.top, end: rect.bottom, facing: 'left' },
    { axis: 'vertical', at: rect.right, start: rect.top, end: rect.bottom, facing: 'right' }
  ]
}

function appendVisibleSegments(segments: string[], sides: Side[], oppositeSides: Side[]) {
  const oppositeByCoordinate = groupByCoordinate(oppositeSides)

  sides.forEach((side) => {
    const coverage = collectCoverage(side, oppositeByCoordinate)
    const visible = subtractCoverage([[side.start, side.end]], coverage)

    visible.forEach(([start, end]) => {
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start + epsilon) return

      segments.push(
        side.axis === 'horizontal' ? `M${start},${side.at}H${end}` : `M${side.at},${start}V${end}`
      )
    })
  })
}

function groupByCoordinate(sides: Side[]): Side[][] {
  const sortedSides = [...sides].sort((a, b) => a.at - b.at)
  const groups: Side[][] = []

  sortedSides.forEach((side) => {
    const lastGroup = groups[groups.length - 1]
    const representative = lastGroup?.[0]

    if (representative && Math.abs(representative.at - side.at) <= epsilon) {
      lastGroup.push(side)
    } else {
      groups.push([side])
    }
  })

  return groups
}

function collectCoverage(side: Side, groups: Side[][]): Array<[number, number]> {
  const coverage: Array<[number, number]> = []

  groups.forEach((group) => {
    if (!group.some((candidate) => Math.abs(candidate.at - side.at) <= epsilon)) return

    group.forEach((candidate) => {
      const start = Math.max(side.start, candidate.start)
      const end = Math.min(side.end, candidate.end)

      if (end > start + epsilon) {
        coverage.push([start, end])
      }
    })
  })

  return mergeIntervals(coverage)
}

function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []

  sorted.forEach(([start, end]) => {
    const previous = merged[merged.length - 1]
    if (previous && start <= previous[1] + epsilon) {
      previous[1] = Math.max(previous[1], end)
    } else {
      merged.push([start, end])
    }
  })

  return merged
}

function subtractCoverage(
  intervals: Array<[number, number]>,
  coverage: Array<[number, number]>
): Array<[number, number]> {
  let result = intervals

  coverage.forEach(([coverStart, coverEnd]) => {
    result = result.flatMap(([start, end]) => {
      if (coverEnd <= start + epsilon || coverStart >= end - epsilon) return [[start, end]]

      const parts: Array<[number, number]> = []
      if (start < coverStart - epsilon) parts.push([start, coverStart])
      if (end > coverEnd + epsilon) parts.push([coverEnd, end])
      return parts
    })
  })

  return result
}
