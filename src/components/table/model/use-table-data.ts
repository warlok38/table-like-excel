import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CellTable } from '../types'
import { makeTableEntries, makeEntriesByKey } from '../lib/table-index'
import { makeTableStructureKey } from '../lib/table-structure'

type UseTableDataOptions = {
  canAcceptIncoming: () => boolean
}

export function useTableData(data: CellTable[][], { canAcceptIncoming }: UseTableDataOptions) {
  const [baseData, setBaseData] = useState(data)
  const lastIncomingRef = useRef(data)

  useEffect(() => {
    if (lastIncomingRef.current === data) return
    lastIncomingRef.current = data

    if (canAcceptIncoming()) {
      setBaseData(data)
    }
  }, [canAcceptIncoming, data])

  const acceptSavedData = useCallback((confirmedData: CellTable[][]) => {
    lastIncomingRef.current = confirmedData
    setBaseData(confirmedData)
  }, [])

  const entries = useMemo(() => makeTableEntries(baseData), [baseData])
  const entriesByKey = useMemo(() => makeEntriesByKey(entries), [entries])
  const structure = useMemo(() => makeTableStructureKey(baseData), [baseData])

  return {
    baseData,
    acceptSavedData,
    entries,
    entriesByKey,
    structure
  }
}
