import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

export type ApiError = {
  message: string
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: ['ParameterRules'],
  endpoints: () => ({})
})
