'use client'
import { useRef, useState } from 'react'
import {
  useCreateRulesMutation,
  useUpdateRulesMutation,
  useDeleteRulesMutation
} from '../api/parameter-rules-api'
import { mockContext } from '../api/mock/parameter-rules-data'
import type { ParameterRulesSnapshot } from './parameter-rules'
import type { DraftErrors, EditorDraft } from './parameter-rule-draft'
import { buildSaveOperations } from './save-operations'
import { mapSaveError, toRulesError } from './save-errors'

interface PendingSave {
  desired: EditorDraft
  allSaved: boolean
  errorMessage: string
  errors: DraftErrors
  uncertainPost: boolean
}
export interface SaveResolution extends PendingSave {
  snapshot: ParameterRulesSnapshot
}
export function useRulesSaveSession(reload: () => Promise<ParameterRulesSnapshot>) {
  const [create] = useCreateRulesMutation(),
    [update] = useUpdateRulesMutation(),
    [remove] = useDeleteRulesMutation()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [syncRequired, setSyncRequired] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const pending = useRef<PendingSave>()
  const inFlight = useRef(false)
  const synchronize = async (): Promise<SaveResolution | undefined> => {
    if (!pending.current) return
    try {
      const snapshot = await reload()
      const result = { ...pending.current, snapshot }
      setSyncRequired(false)
      setUncertain(result.uncertainPost)
      setStatus(
        result.uncertainPost
          ? 'Результат создания неизвестен. Данные обновлены; повторный POST заблокирован. Закройте форму и проверьте сохранённые правила перед новым созданием.'
          : result.errorMessage
      )
      pending.current = undefined
      return result
    } catch {
      setSyncRequired(true)
      setStatus(
        'Не удалось обновить данные после сохранения. Повторите загрузку. Запросы записи повторно не отправляются.'
      )
    }
  }
  const save = async (
    initial: EditorDraft,
    desired: EditorDraft
  ): Promise<SaveResolution | undefined> => {
    if (inFlight.current || syncRequired || uncertain) return
    inFlight.current = true
    setBusy(true)
    setStatus('')
    const context: PendingSave = {
      desired: structuredClone(desired),
      allSaved: false,
      errorMessage: '',
      errors: { byRule: {} },
      uncertainPost: false
    }
    pending.current = context
    try {
      const operations = buildSaveOperations(
        initial,
        desired,
        mockContext.journalId,
        mockContext.author
      )
      let completed = 0
      for (const operation of operations) {
        try {
          const journalId = mockContext.journalId
          if (operation.method === 'post')
            await create({ journalId, body: operation.body }).unwrap()
          else if (operation.method === 'put')
            await update({ journalId, body: operation.body }).unwrap()
          else await remove({ journalId, body: operation.body }).unwrap()
          completed++
        } catch (error) {
          const failure = toRulesError(error)
          context.uncertainPost = Boolean(failure.uncertain && operation.method === 'post')
          context.errorMessage =
            (completed ? 'Изменения сохранены частично. ' : '') +
            failure.message +
            ' Несохранённые изменения остались в форме.'
          context.errors = mapSaveError(failure, operation)
          break
        }
      }
      context.allSaved = completed === operations.length
      return await synchronize()
    } catch (error) {
      pending.current = undefined
      setStatus(error instanceof Error ? error.message : 'Не удалось подготовить сохранение')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const retry = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    try {
      return await synchronize()
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return { save, retry, busy, status, syncRequired, uncertain }
}
