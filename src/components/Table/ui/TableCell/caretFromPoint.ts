type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  caretRangeFromPoint?: (x: number, y: number) => Range | null
}

export function caretFromPoint(span: HTMLSpanElement, x: number, y: number): number {
  const text = span.firstChild
  if (!(text instanceof Text) || !text.length) return 0
  const boundaries = [
    ...Array.from(
      new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text.data),
      (segment) => segment.index
    ),
    text.length
  ]
  const nearestBoundary = (offset: number) =>
    boundaries.reduce((nearest, boundary) =>
      Math.abs(boundary - offset) < Math.abs(nearest - offset) ? boundary : nearest
    )
  const document = span.ownerDocument as CaretDocument
  const caret = document.caretPositionFromPoint?.(x, y)
  const range = caret ? null : document.caretRangeFromPoint?.(x, y)
  const node = caret?.offsetNode ?? range?.startContainer
  const offset = caret?.offset ?? range?.startOffset
  const bounds = span.getBoundingClientRect()
  if (
    node === text &&
    offset !== undefined &&
    x >= bounds.left &&
    x <= bounds.right &&
    y >= bounds.top &&
    y <= bounds.bottom
  ) {
    return nearestBoundary(offset)
  }

  // Padding and empty space may hit another node. Compare glyph edges on the
  // nearest visual line, excluding text clipped outside the content container.
  const clip = span.parentElement!.getBoundingClientRect()
  const probe = document.createRange()
  let best = { offset: 0, vertical: Infinity, horizontal: Infinity }
  const consider = (boundary: number, edge: number, rect: DOMRect) => {
    if (rect.bottom < clip.top || rect.top > clip.bottom || edge < clip.left || edge > clip.right)
      return
    const vertical = Math.max(rect.top - y, y - rect.bottom, 0)
    const horizontal = Math.abs(edge - x)
    if (vertical < best.vertical || (vertical === best.vertical && horizontal < best.horizontal)) {
      best = { offset: boundary, vertical, horizontal }
    }
  }
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    probe.setStart(text, boundaries[index])
    probe.setEnd(text, boundaries[index + 1])
    const rects = Array.from(probe.getClientRects())
    if (!rects.length) continue
    consider(boundaries[index], rects[0].left, rects[0])
    const last = rects[rects.length - 1]
    consider(boundaries[index + 1], last.right, last)
  }
  return best.offset
}
