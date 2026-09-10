import { useCallback, useMemo, useRef, useState } from 'react'

import { emptyPendingChanges, summarizePendingChanges } from './pending-changes'
import type { PendingChanges } from './pending.types'

export function useTableChanges() {
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>(emptyPendingChanges)
  const pendingRef = useRef(pendingChanges)

  const updatePending = useCallback((updater: (current: PendingChanges) => PendingChanges) => {
    const next = updater(pendingRef.current)
    pendingRef.current = next
    setPendingChanges(next)
  }, [])

  const resetPending = useCallback(() => {
    pendingRef.current = emptyPendingChanges
    setPendingChanges(emptyPendingChanges)
  }, [])

  const summary = useMemo(() => summarizePendingChanges(pendingChanges), [pendingChanges])

  return {
    pendingChanges,
    pendingRef,
    updatePending,
    resetPending,
    summary
  }
}
