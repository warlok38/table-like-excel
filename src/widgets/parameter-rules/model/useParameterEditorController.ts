'use client'
import { useMemo, useRef, useState } from 'react'
import {
  createEmptyRule,
  clearChangedRuleErrors,
  makeEditorDraft,
  validateEditorDraft,
  toFormattingRules,
  type DraftErrors,
  type DraftRule,
  type RuleChange,
  type EditorDraft
} from './parameterRuleDraft'
import type { ParameterConfiguration, RuleCatalogs } from './parameterRules'
import { useRulesSaveSession, type SaveResolution } from './useRulesSaveSession'
interface Options {
  parameterId: string
  journalId: string
  author: string
  ruleCatalogs: RuleCatalogs
  configuration?: ParameterConfiguration
  isInteractionDisabled: boolean
  reload(): Promise<ParameterConfiguration>
  onSaved(): void
}
export type ParameterEditorValidationTarget =
  { type: 'parameter' } | { type: 'rules' } | { type: 'rule'; uiKey: string }
export function useParameterEditorController({
  parameterId,
  journalId,
  author,
  configuration,
  ruleCatalogs,
  isInteractionDisabled,
  reload,
  onSaved
}: Options) {
  const [draft, setDraft] = useState<EditorDraft>(() =>
    configuration
      ? makeEditorDraft(configuration)
      : { parameterId, rules: [createEmptyRule('first-new')] }
  )
  const [initialDraft, setInitialDraft] = useState<EditorDraft>(() =>
    configuration ? makeEditorDraft(configuration) : { parameterId, rules: [] }
  )
  const [errors, setErrors] = useState<DraftErrors>({ byRule: {} })
  const nextKey = useRef(0)
  const session = useRulesSaveSession(reload, { journalId, author })
  const disabled =
    isInteractionDisabled || session.busy || session.syncRequired || session.uncertain
  const initialRulesByKey = useMemo(
    () => new Map(initialDraft.rules.map((rule) => [rule.uiKey, rule])),
    [initialDraft]
  )
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft)
  const applyResolution = (result?: SaveResolution) => {
    if (!result) return
    const fresh = makeEditorDraft(result.configuration)
    setInitialDraft(fresh)
    // POST is the last operation. If acknowledged, the complete desired state is on the server.
    // Otherwise only existing IDs were changed, so the unsaved target can be retained verbatim.
    setDraft(result.allSaved ? fresh : result.desired)
    setErrors(result.errors)
    if (result.allSaved) onSaved()
  }
  const updateRule = (
    uiKey: string,
    change: RuleChange,
    update: (rule: DraftRule) => DraftRule
  ) => {
    if (disabled) return
    const currentRule = draft.rules.find((rule) => rule.uiKey === uiKey)
    if (!currentRule) return
    const next = update(currentRule)
    const initial = initialRulesByKey.get(uiKey)
    const changedRule = initial
      ? {
          ...next,
          isDefault: initial.isDefault,
          aggregationLevelId: initial.aggregationLevelId,
          aggregationRuleId: initial.aggregationRuleId,
          planTypeId: initial.planTypeId,
          functionId: initial.functionId,
          value: initial.isDefault ? next.value : initial.value
        }
      : next
    setDraft((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.uiKey === uiKey ? changedRule : rule))
    }))
    setErrors((current) => {
      const byRule = { ...current.byRule }
      if (byRule[uiKey]) {
        const next = clearChangedRuleErrors(byRule[uiKey], change, changedRule)
        if (Object.keys(next).length) byRule[uiKey] = next
        else delete byRule[uiKey]
      }
      return { ...current, byRule }
    })
  }
  const addRule = () => {
    if (disabled) return
    const uiKey = 'new-' + nextKey.current++
    setDraft((current) => ({ ...current, rules: [createEmptyRule(uiKey), ...current.rules] }))
    return uiKey
  }
  const removeRule = (uiKey: string) => {
    if (disabled) return
    setDraft((current) => ({
      ...current,
      rules: current.rules.filter((rule) => rule.uiKey !== uiKey)
    }))
  }
  const removed = initialDraft.rules.flatMap((before) => {
    const after = draft.rules.find((rule) => rule.id === before.id)
    if (!after)
      return [
        {
          key: before.uiKey,
          label: 'Правило: ' + before.name,
          restore: () =>
            setDraft((current) => ({
              ...current,
              rules: [...current.rules, structuredClone(before)]
            }))
        }
      ]
    return [
      ...before.uiRules
        .filter((item) => item.id && !after.uiRules.some((next) => next.id === item.id))
        .map((item) => ({
          key: item.id!,
          label: before.name + ' — ' + item.label,
          restore: () =>
            updateRule(after.uiKey, { collection: 'ui_rules' }, (rule) => ({
              ...rule,
              uiRules: [
                ...rule.uiRules.filter((next) => next.key !== item.key),
                structuredClone(item)
              ]
            }))
        })),
      ...before.notifications
        .filter((item) => item.id && !after.notifications.some((next) => next.id === item.id))
        .map((item) => ({
          key: item.id!,
          label: before.name + ' — уведомление',
          restore: () =>
            updateRule(after.uiKey, { collection: 'notify_rules' }, (rule) => ({
              ...rule,
              notifications: [...rule.notifications, structuredClone(item)]
            }))
        }))
    ]
  })
  const validateAndSave = async (): Promise<ParameterEditorValidationTarget | undefined> => {
    if (disabled || !isDirty) return
    const next = validateEditorDraft(draft, ruleCatalogs)
    setErrors(next)
    if (next.parameter) return { type: 'parameter' }
    const invalid = draft.rules.find((rule) => next.byRule[rule.uiKey])
    if (invalid) return { type: 'rule', uiKey: invalid.uiKey }
    // Normalize saved strings without dropping local UI keys.
    const normalized = toFormattingRules(draft.rules)
    const desired = {
      ...draft,
      rules: normalized.map((rule, index) => ({ ...rule, uiKey: draft.rules[index].uiKey }))
    }
    setDraft(desired)
    applyResolution(await session.save(initialDraft, desired))
  }
  const deleteAll = async () => {
    if (disabled) return
    const desired = { parameterId, rules: [] }
    setDraft(desired)
    applyResolution(await session.save(initialDraft, desired))
  }
  return {
    draft,
    errors,
    hasRules: draft.rules.length > 0,
    initialRulesByKey,
    isDirty,
    updateRule,
    addRule,
    removeRule,
    validateAndSave,
    disabled,
    busy: session.busy,
    status: session.status,
    syncRequired: session.syncRequired,
    uncertain: session.uncertain,
    retry: async () => applyResolution(await session.retry()),
    removed,
    deleteAll
  }
}
export type ParameterEditorController = ReturnType<typeof useParameterEditorController>
