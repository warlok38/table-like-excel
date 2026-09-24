'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  createEmptyRule,
  emptyDraftErrors,
  makeEditorDraft,
  toFormattingRules,
  validateEditorDraft,
  type DraftErrors,
  type DraftRule,
  type EditorDraft
} from './parameter-rule-draft'
import type { ParameterConfiguration } from './parameter-rules'

interface UseParameterEditorControllerOptions {
  configuration?: ParameterConfiguration
  open: boolean
  isInteractionDisabled: boolean
  onSave(configuration: Pick<ParameterConfiguration, 'parameterId' | 'rules'>): Promise<void>
}

export type ParameterEditorValidationTarget =
  { type: 'parameter' } | { type: 'rules' } | { type: 'rule'; uiKey: string }

export function useParameterEditorController({
  configuration,
  open,
  isInteractionDisabled,
  onSave
}: UseParameterEditorControllerOptions) {
  const nextRuleKey = useRef(0)
  const [draft, setDraft] = useState<EditorDraft>({ rules: [] })
  const [initialDraft, setInitialDraft] = useState<EditorDraft>({ rules: [] })
  const [errors, setErrors] = useState<DraftErrors>(emptyDraftErrors)

  useEffect(() => {
    if (!open) return

    const nextDraft = makeEditorDraft(configuration)
    setDraft(nextDraft)
    setInitialDraft(nextDraft)
    setErrors(emptyDraftErrors)
  }, [configuration, open])

  const initialRulesByKey = useMemo(
    () => new Map(initialDraft.rules.map((rule) => [rule.uiKey, rule])),
    [initialDraft.rules]
  )
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft)
  const hasRules = draft.rules.length > 0

  const setParameterId = (parameterId: number) => {
    if (isInteractionDisabled) return

    setDraft((current) => ({ ...current, parameterId }))
    setErrors((current) => ({ ...current, parameter: undefined }))
  }

  const updateRule = (
    uiKey: string,
    errorField: keyof DraftErrors['byRule'][string] | undefined,
    update: (rule: DraftRule) => DraftRule
  ) => {
    if (isInteractionDisabled) return

    setDraft((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.uiKey === uiKey ? update(rule) : rule))
    }))
    if (!errorField) return

    setErrors((current) => {
      const nextRuleErrors = { ...current.byRule[uiKey] }
      delete nextRuleErrors[errorField]
      const nextByRule = { ...current.byRule }

      if (Object.keys(nextRuleErrors).length === 0) {
        delete nextByRule[uiKey]
      } else {
        nextByRule[uiKey] = nextRuleErrors
      }

      return { ...current, byRule: nextByRule }
    })
  }

  const addRule = () => {
    if (isInteractionDisabled) return undefined

    const uiKey = `new-${nextRuleKey.current++}`
    setDraft((current) => ({ ...current, rules: [createEmptyRule(uiKey), ...current.rules] }))
    setErrors((current) => ({ ...current, rules: undefined }))
    return uiKey
  }

  const removeRule = (uiKey: string) => {
    if (isInteractionDisabled) return

    setDraft((current) => ({
      ...current,
      rules: current.rules.filter((rule) => rule.uiKey !== uiKey)
    }))
    setErrors((current) => {
      const nextByRule = { ...current.byRule }
      delete nextByRule[uiKey]
      return { ...current, byRule: nextByRule }
    })
  }

  const validateAndSave = async (): Promise<ParameterEditorValidationTarget | undefined> => {
    if (!isDirty || isInteractionDisabled) return undefined

    const nextErrors = validateEditorDraft(draft)
    setErrors(nextErrors)
    const firstInvalidRuleKey = draft.rules.find((rule) => nextErrors.byRule[rule.uiKey])?.uiKey

    if (nextErrors.parameter) return { type: 'parameter' }
    if (nextErrors.rules) return { type: 'rules' }
    if (firstInvalidRuleKey) return { type: 'rule', uiKey: firstInvalidRuleKey }

    await onSave({ parameterId: draft.parameterId!, rules: toFormattingRules(draft.rules) })
    return undefined
  }

  return {
    draft,
    errors,
    hasRules,
    initialRulesByKey,
    isDirty,
    setParameterId,
    updateRule,
    addRule,
    removeRule,
    validateAndSave
  }
}

export type ParameterEditorController = ReturnType<typeof useParameterEditorController>
