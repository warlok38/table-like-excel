import { useCallback, useMemo, useRef, useState, type MutableRefObject } from 'react'

import { emptyPendingChanges, summarizePendingChanges, type PendingChanges } from './pendingChanges'

type UseTableChangesOptions = {
  isBlockedRef: MutableRefObject<boolean>
  onLocalChange: () => void
}

export function useTableChanges({ isBlockedRef, onLocalChange }: UseTableChangesOptions) {
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>(emptyPendingChanges)
  const pendingRef = useRef(pendingChanges)

  const updatePending = useCallback(
    (updater: (current: PendingChanges) => PendingChanges) => {
      if (isBlockedRef.current) return
      const next = updater(pendingRef.current)
      if (next === pendingRef.current) return
      pendingRef.current = next
      setPendingChanges(next)
      onLocalChange()
    },
    [isBlockedRef, onLocalChange]
  )

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
