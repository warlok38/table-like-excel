import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CellTable } from '../../types'
import { makeTableEntries, makeEntriesByKey } from './table-index'
import { makeTableStructure } from './table-structure'

type UseTableDataOptions = {
  canAcceptIncoming: () => boolean
}

export function useTableData(data: CellTable[][], { canAcceptIncoming }: UseTableDataOptions) {
  const [baseData, setBaseData] = useState(data)
  const lastObservedPropRef = useRef(data)
  const canAcceptIncomingRef = useRef(canAcceptIncoming)
  canAcceptIncomingRef.current = canAcceptIncoming

  useEffect(() => {
    if (lastObservedPropRef.current === data) return
    lastObservedPropRef.current = data

    if (canAcceptIncomingRef.current()) {
      setBaseData(data)
    }
  }, [data])

  const acceptSavedData = useCallback((confirmedData: CellTable[][]) => {
    setBaseData(confirmedData)
  }, [])

  const entries = useMemo(() => makeTableEntries(baseData), [baseData])
  const entriesByKey = useMemo(() => makeEntriesByKey(entries), [entries])
  const structureRef = useRef<ReturnType<typeof makeTableStructure> | null>(null)
  const structure = useMemo(() => {
    const next = makeTableStructure(baseData)
    if (structureRef.current?.key === next.key) return structureRef.current
    structureRef.current = next
    return next
  }, [baseData])

  return {
    baseData,
    acceptSavedData,
    entries,
    entriesByKey,
    structure
  }
}
