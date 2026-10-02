import type {
  CreateRulesBody,
  UpdateRulesBody,
  DeleteRulesBody,
  UiInput,
  NotifyInput
} from '../api/contracts'
import type { EditorDraft } from './parameterRuleDraft'
import type { UiResult, NotificationResult } from './parameterRules'

export type SourceMap = Record<string, { uiKey: string; field?: string }>
export type SaveOperation = { sources: SourceMap } & (
  | { method: 'post'; body: CreateRulesBody }
  | { method: 'put'; body: UpdateRulesBody }
  | { method: 'delete'; body: DeleteRulesBody }
)
export function buildSaveOperations(
  initial: EditorDraft,
  desired: EditorDraft,
  journalId: string,
  author: string
): SaveOperation[] {
  const deletes: SaveOperation[] = [],
    updates: SaveOperation[] = []
  const post: CreateRulesBody = { parameter_rules: [], ui_rules: [], notify_rules: [] }
  const sources: SourceMap = {}
  const context = { parameters_tech_id: desired.parameterId!, journals_tech_id: journalId }
  const ui = (item: UiResult): UiInput => ({
    ...context,
    name: item.name,
    attr_key: item.key,
    description: item.description ?? '',
    interface_name: item.label,
    value: item.value.trim()
  })
  const notify = (item: NotificationResult): NotifyInput => ({
    ...context,
    message_template: item.text.trim(),
    description: item.description ?? '',
    ...(item.channel !== undefined ? { channel_type: item.channel } : {}),
    ...(item.recipients !== undefined ? { reciepient: item.recipients } : {})
  })
  const remove = (kind: keyof DeleteRulesBody, id: string, uiKey: string) =>
    deletes.push({
      method: 'delete',
      body: { parameter_rules: [], ui_rules: [], notify_rules: [], [kind]: [id] },
      sources: { [kind + '.0']: { uiKey } }
    })
  initial.rules.forEach((rule) => {
    if (rule.id && !desired.rules.some((item) => item.id === rule.id))
      remove('parameter_rules', rule.id, rule.uiKey)
  })
  desired.rules.forEach((rule) => {
    const before = initial.rules.find((item) => item.id && item.id === rule.id)
    if (!rule.id) {
      const index = post.parameter_rules.length
      sources['parameter_rules.' + index] = { uiKey: rule.uiKey }
      post.parameter_rules.push({
        ...context,
        name: rule.name.trim(),
        description: rule.description?.trim() ?? '',
        created_by: author,
        aggregation_levels_tech_id: rule.aggregationLevelId!,
        aggregation_rules_tech_id: rule.aggregationRuleId!,
        plan_types_tech_id: rule.planTypeId!,
        is_default: rule.isDefault,
        ...(!rule.isDefault ? { functions_tech_id: rule.functionId } : {}),
        value: rule.value!,
        ui_rules: rule.uiRules.map(ui),
        notify_rules: rule.notifications.map(notify)
      })
      return
    }
    if (!before) throw new Error('Исходное правило не найдено. Обновите данные.')
    if (
      rule.name.trim() !== before.name.trim() ||
      (rule.description?.trim() ?? '') !== (before.description?.trim() ?? '') ||
      rule.value !== before.value
    ) {
      updates.push({
        method: 'put',
        body: {
          parameter_rules: [
            {
              rules_tech_id: rule.id,
              name: rule.name.trim(),
              description: rule.description?.trim() ?? '',
              value: rule.value!
            }
          ],
          ui_rules: [],
          notify_rules: []
        },
        sources: { 'parameter_rules.0': { uiKey: rule.uiKey } }
      })
    }
    before.uiRules.forEach((item) => {
      if (item.id && !rule.uiRules.some((next) => next.id === item.id))
        remove('ui_rules', item.id, rule.uiKey)
    })
    before.notifications.forEach((item) => {
      if (item.id && !rule.notifications.some((next) => next.id === item.id))
        remove('notify_rules', item.id, rule.uiKey)
    })
    rule.uiRules.forEach((item, index) => {
      const source = { uiKey: rule.uiKey, field: 'ui_rules.' + index }
      if (!item.id) {
        sources['ui_rules.' + post.ui_rules.length] = source
        post.ui_rules.push({ ...ui(item), rules_tech_id: rule.id! })
      } else {
        const previous = before.uiRules.find((entry) => entry.id === item.id)
        if (!previous) throw new Error('Исходное оформление не найдено')
        if (JSON.stringify(ui(item)) !== JSON.stringify(ui(previous))) {
          const { parameters_tech_id: _p, journals_tech_id: _j, ...input } = ui(item)
          updates.push({
            method: 'put',
            body: {
              parameter_rules: [],
              ui_rules: [{ ...input, ui_rules_tech_id: item.id }],
              notify_rules: []
            },
            sources: { 'ui_rules.0': source }
          })
        }
      }
    })
    rule.notifications.forEach((item, index) => {
      const source = { uiKey: rule.uiKey, field: 'notify_rules.' + index }
      if (!item.id) {
        sources['notify_rules.' + post.notify_rules.length] = source
        post.notify_rules.push({ ...notify(item), rules_tech_id: rule.id! })
      } else {
        const previous = before.notifications.find((entry) => entry.id === item.id)
        if (!previous) throw new Error('Исходное уведомление не найдено')
        if (JSON.stringify(notify(item)) !== JSON.stringify(notify(previous))) {
          const { parameters_tech_id: _p, journals_tech_id: _j, ...input } = notify(item)
          updates.push({
            method: 'put',
            body: {
              parameter_rules: [],
              ui_rules: [],
              notify_rules: [{ ...input, rule_notification_tech_id: item.id }]
            },
            sources: { 'notify_rules.0': source }
          })
        }
      }
    })
  })
  return [
    ...deletes,
    ...updates,
    ...(post.parameter_rules.length || post.ui_rules.length || post.notify_rules.length
      ? [{ method: 'post' as const, body: post, sources }]
      : [])
  ]
}
