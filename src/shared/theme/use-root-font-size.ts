'use client'

import { useEffect, useState } from 'react'

// Ant's virtual lists accept pixel measurements, even when their CSS uses rem.
export function useRootFontSize(): number {
  const [fontSize, setFontSize] = useState(19.2)

  useEffect(() => {
    const probe = document.createElement('span')
    probe.style.cssText =
      'position:fixed;width:1rem;height:0;visibility:hidden;pointer-events:none;'
    document.body.appendChild(probe)

    const update = () => {
      setFontSize(parseFloat(getComputedStyle(document.documentElement).fontSize))
    }
    const observer = new ResizeObserver(update)
    observer.observe(probe)
    update()

    return () => {
      observer.disconnect()
      probe.remove()
    }
  }, [])

  return fontSize
}
