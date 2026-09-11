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

type Interval = [number, number]
type LineIndex = { coordinates: number[]; lines: Map<number, Interval[]> }

function indexLines(sides: Side[]): LineIndex {
  const lines = new Map<number, Interval[]>()
  for (const side of sides) {
    if (side.end <= side.start + epsilon) continue
    const line = lines.get(side.at)
    if (line) line.push([side.start, side.end])
    else lines.set(side.at, [[side.start, side.end]])
  }
  return { coordinates: Array.from(lines.keys()).sort((a, b) => a - b), lines }
}

function lowerBound(values: number[], target: number): number {
  let low = 0,
    high = values.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (values[mid] < target) low = mid + 1
    else high = mid
  }
  return low
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  intervals.sort((a, b) => a[0] - b[0])
  const result: Interval[] = []
  for (const [start, end] of intervals) {
    const last = result[result.length - 1]
    if (last && start <= last[1] + epsilon) last[1] = Math.max(last[1], end)
    else result.push([start, end])
  }
  return result
}

type Coverage = {
  intervals: Interval[]
  ends: number[]
  raw: Interval[]
  rawEnds: number[]
  starts: number[]
  prefixEnds: number[]
}

// Most grid edges reuse the union. Near epsilon-sized intersections we must
// filter individual overlaps BEFORE union, preserving the small-edge contract.
function coverageForSide(
  coverage: Coverage,
  side: Side
): { intervals: Interval[]; ends: number[] } {
  let low = 0,
    high = coverage.rawEnds.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (coverage.rawEnds[mid] <= side.start) low = mid + 1
    else high = mid
  }
  const nearStart = low
  const nearEnd = lowerBound(coverage.starts, side.end - epsilon)
  const needsClipping =
    coverage.rawEnds[nearStart] <= side.start + epsilon || coverage.starts[nearEnd] < side.end
  if (!needsClipping) return coverage
  const clipped: Interval[] = []
  for (
    let i = lowerBound(coverage.prefixEnds, side.start + epsilon);
    i < coverage.raw.length;
    i++
  ) {
    const [start, end] = coverage.raw[i]
    if (start >= side.end - epsilon) break
    const left = Math.max(side.start, start),
      right = Math.min(side.end, end)
    if (right > left + epsilon) clipped.push([left, right])
  }
  const intervals = mergeIntervals(clipped)
  return { intervals, ends: intervals.map((interval) => interval[1]) }
}

function appendVisibleSegments(segments: string[], sides: Side[], oppositeSides: Side[]) {
  const index = indexLines(oppositeSides)
  // One coverage union per exact source coordinate. Epsilon is pairwise,
  // never a transitive group relation (10.00/10.09/10.16 stay distinct).
  const cache = new Map<number, Coverage>()
  for (const side of sides) {
    let coverage = cache.get(side.at)
    if (!coverage) {
      const intervals: Interval[] = []
      for (
        let i = lowerBound(index.coordinates, side.at - epsilon);
        i < index.coordinates.length;
        i++
      ) {
        const at = index.coordinates[i]
        if (at > side.at + epsilon) break
        if (Math.abs(at - side.at) > epsilon) continue
        for (const interval of index.lines.get(at)!) intervals.push(interval)
      }
      intervals.sort((a, b) => a[0] - b[0])
      const prefixEnds: number[] = []
      for (const interval of intervals)
        prefixEnds.push(Math.max(prefixEnds[prefixEnds.length - 1] ?? -Infinity, interval[1]))
      const merged = mergeIntervals(intervals)
      coverage = {
        intervals: merged,
        ends: merged.map((interval) => interval[1]),
        raw: intervals,
        rawEnds: intervals.map((interval) => interval[1]).sort((a, b) => a - b),
        starts: intervals.map((interval) => interval[0]),
        prefixEnds
      }
      cache.set(side.at, coverage)
    }
    const append = (start: number, end: number) => {
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start + epsilon) return
      segments.push(
        side.axis === 'horizontal' ? `M${start},${side.at}H${end}` : `M${side.at},${start}V${end}`
      )
    }
    const visibleCoverage = coverageForSide(coverage, side)
    let cursor = side.start
    // Jump to the first possible overlap instead of scanning a whole line
    // for every cell. Only overlapping intervals are traversed.
    for (
      let i = lowerBound(visibleCoverage.ends, cursor + epsilon);
      i < visibleCoverage.intervals.length;
      i++
    ) {
      const [start, end] = visibleCoverage.intervals[i]
      if (start >= side.end - epsilon) break
      if (end <= cursor + epsilon) continue
      append(cursor, Math.min(start, side.end))
      cursor = Math.max(cursor, end)
      if (cursor >= side.end - epsilon) break
    }
    append(cursor, side.end)
  }
}
