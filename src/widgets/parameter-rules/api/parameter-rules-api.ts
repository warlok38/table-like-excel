import { baseApi, type ApiError } from '@/shared/api'

import type {
  ParameterConfiguration,
  ParameterRulesSnapshot,
  SaveParameterInput
} from '../model/parameter-rules'
import { parameterRulesMockService } from './mock/parameter-rules-service'

const parameterRulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getParameters: builder.query<ParameterRulesSnapshot, void>({
      queryFn: () => runMockRequest(() => parameterRulesMockService.getParameters()),
      providesTags: ['ParameterRules']
    }),
    saveParameter: builder.mutation<ParameterConfiguration, SaveParameterInput>({
      async queryFn(configuration, { dispatch }) {
        const result = await runMockRequest(() =>
          parameterRulesMockService.saveParameter(configuration)
        )

        const savedConfiguration = result.data
        if (savedConfiguration) {
          dispatch(
            parameterRulesApi.util.updateQueryData('getParameters', undefined, (snapshot) => {
              const existingIndex = snapshot.configurations.findIndex(
                (item) => item.parameterId === savedConfiguration.parameterId
              )

              if (existingIndex === -1) {
                snapshot.configurations.unshift(savedConfiguration)
              } else {
                snapshot.configurations[existingIndex] = savedConfiguration
              }
            })
          )
        }

        return result
      },
      invalidatesTags: (_result, error) => (error ? [] : ['ParameterRules'])
    }),
    deleteParameter: builder.mutation<null, number>({
      async queryFn(parameterId, { dispatch }) {
        const result = await runMockRequest(() =>
          parameterRulesMockService.deleteParameter(parameterId)
        )

        if (!result.error) {
          dispatch(
            parameterRulesApi.util.updateQueryData('getParameters', undefined, (snapshot) => {
              snapshot.configurations = snapshot.configurations.filter(
                (configuration) => configuration.parameterId !== parameterId
              )
            })
          )
        }

        return result
      },
      invalidatesTags: (_result, error) => (error ? [] : ['ParameterRules'])
    })
  })
})

async function runMockRequest<T>(request: () => Promise<T>) {
  try {
    return { data: await request() }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Неизвестная ошибка mock API'
      } satisfies ApiError
    }
  }
}

export const { useGetParametersQuery, useSaveParameterMutation, useDeleteParameterMutation } =
  parameterRulesApi
