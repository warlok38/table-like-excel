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
import type { ParameterConfiguration, RuleCatalogs } from './parameter-rules'

interface UseParameterEditorControllerOptions {
  parameterId: number
  ruleCatalogs: RuleCatalogs
  configuration?: ParameterConfiguration
  open: boolean
  isInteractionDisabled: boolean
  onSave(configuration: Pick<ParameterConfiguration, 'parameterId' | 'rules'>): Promise<void>
}

export type ParameterEditorValidationTarget =
  { type: 'parameter' } | { type: 'rules' } | { type: 'rule'; uiKey: string }

export function useParameterEditorController({
  parameterId,
  configuration,
  ruleCatalogs,
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

    const nextDraft = configuration
      ? makeEditorDraft(configuration)
      : { parameterId, rules: [createEmptyRule('first-new')] }
    setDraft(nextDraft)
    setInitialDraft(nextDraft)
    setErrors(emptyDraftErrors)
  }, [configuration, open, parameterId])

  const initialRulesByKey = useMemo(
    () => new Map((configuration ? initialDraft.rules : []).map((rule) => [rule.uiKey, rule])),
    [configuration, initialDraft.rules]
  )
  useEffect(() => {
    setErrors((current) =>
      current.parameter || current.rules || Object.keys(current.byRule).length
        ? validateEditorDraft(draft, ruleCatalogs)
        : current
    )
  }, [draft, ruleCatalogs])

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft)
  const hasRules = draft.rules.length > 0

  const updateRule = (
    uiKey: string,
    errorField: keyof DraftErrors['byRule'][string] | undefined,
    update: (rule: DraftRule) => DraftRule
  ) => {
    if (isInteractionDisabled) return

    setDraft((current) => ({
      ...current,
      rules: current.rules.map((rule) => {
        if (rule.uiKey !== uiKey) return rule
        const next = update(rule)
        const initial = initialRulesByKey.get(uiKey)
        if (!initial) return next
        return {
          ...next,
          isDefault: initial.isDefault,
          aggregationLevelId: initial.aggregationLevelId,
          aggregationRuleId: initial.aggregationRuleId,
          planTypeId: initial.planTypeId,
          condition: initial.condition ? { ...initial.condition } : undefined
        }
      })
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

    const nextErrors = validateEditorDraft(draft, ruleCatalogs)
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
    updateRule,
    addRule,
    removeRule,
    validateAndSave
  }
}

export type ParameterEditorController = ReturnType<typeof useParameterEditorController>
