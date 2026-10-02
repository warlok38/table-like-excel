import { configureStore } from '@reduxjs/toolkit'

import { baseApi } from '@/shared/api'

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware)
  })

export type AppStore = ReturnType<typeof makeStore>
