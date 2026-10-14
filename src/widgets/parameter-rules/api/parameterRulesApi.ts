import { baseApi } from '@/shared/api'
import type {
  CatalogsDto,
  ParameterDto,
  CreateRulesBody,
  UpdateRulesBody,
  DeleteRulesBody
} from './contracts'
import { parameterRulesMockService as service } from './mock/parameterRulesService'
import { toRulesError } from './toRulesError'
export const parameterRulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRuleCatalogs: builder.query<CatalogsDto, string>({
      queryFn: (journalId) => runMockRequest(() => service.getCatalogs(journalId)),
      providesTags: (_data, _error, id) => [{ type: 'ParameterRules', id: id + ':catalogs' }]
    }),
    getRulesByParameter: builder.query<ParameterDto[], string>({
      queryFn: (journalId) => runMockRequest(() => service.getRules(journalId)),
      providesTags: (_data, _error, id) => [{ type: 'ParameterRules', id: id + ':rules' }]
    }),
    createRules: builder.mutation<string, { journalId: string; body: CreateRulesBody }>({
      queryFn: ({ journalId, body }) => runMockRequest(() => service.create(journalId, body))
    }),
    updateRules: builder.mutation<null, { journalId: string; body: UpdateRulesBody }>({
      queryFn: ({ journalId, body }) => runMockRequest(() => service.update(journalId, body))
    }),
    deleteRules: builder.mutation<null, { journalId: string; body: DeleteRulesBody }>({
      queryFn: ({ journalId, body }) => runMockRequest(() => service.delete(journalId, body))
    })
  })
})
async function runMockRequest<T>(
  request: () => Promise<T>
): Promise<{ data: T } | { error: ReturnType<typeof toRulesError> }> {
  try {
    return { data: await request() }
  } catch (error) {
    return { error: toRulesError(error, 'Неизвестная ошибка API') }
  }
}
export const {
  useGetRuleCatalogsQuery,
  useGetRulesByParameterQuery,
  useCreateRulesMutation,
  useUpdateRulesMutation,
  useDeleteRulesMutation
} = parameterRulesApi
