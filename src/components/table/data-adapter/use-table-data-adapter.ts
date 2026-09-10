'use client'

import { useCallback, useEffect, useState } from 'react'
import type { LoadedTableSnapshot, TableDataAdapter, TableSaveChangeset } from './types'

type LoadState =
  | { status: 'loading'; snapshot: null; error: null }
  | { status: 'ready'; snapshot: LoadedTableSnapshot; error: null }
  | { status: 'error'; snapshot: null; error: string }

export function useTableDataAdapter(adapter: TableDataAdapter) {
  const [state, setState] = useState<LoadState>({ status: 'loading', snapshot: null, error: null })

  useEffect(() => {
    let isMounted = true
    setState({ status: 'loading', snapshot: null, error: null })

    Promise.all([adapter.loadTableData(), adapter.loadAvailableBackgroundColors()])
      .then(([data, availableBackgroundColors]) => {
        const snapshot: LoadedTableSnapshot = { data, availableBackgroundColors }
        if (isMounted) setState({ status: 'ready', snapshot, error: null })
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({
            status: 'error',
            snapshot: null,
            error: error instanceof Error ? error.message : 'Не удалось загрузить таблицу'
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [adapter])

  const saveChanges = useCallback(
    async (changeset: TableSaveChangeset) => {
      const snapshot = await adapter.saveChanges(changeset)
      setState({ status: 'ready', snapshot, error: null })
      return snapshot.data
    },
    [adapter]
  )

  return {
    ...state,
    saveChanges
  }
}
