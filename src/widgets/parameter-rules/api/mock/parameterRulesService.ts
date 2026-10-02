import type {
  CreateRulesBody,
  UpdateRulesBody,
  DeleteRulesBody,
  UiInput,
  NotifyInput,
  RuleDto
} from '../contracts'
import { catalogsMock, parametersMock, mockContext } from './parameterRulesData'
import { reservedIds } from './reservedIds'
import { rejectMock, validateRule } from './mockValidation'
import { beginMockRequest, finishMockRequest } from './mockFaults'

let state = {
  catalogs: structuredClone(catalogsMock),
  parameters: structuredClone(parametersMock),
  nextId: 0
}
type State = typeof state
function checkJournal(journalId: string) {
  if (journalId !== mockContext.journalId) rejectMock('Журнал не найден', [], 404)
}
function takeId(draft: State) {
  const id = reservedIds[draft.nextId++]
  if (!id) rejectMock('Исчерпан статический резерв ID мока', [], 409)
  return id
}
function parent(draft: State, id: string): RuleDto {
  const rule = draft.parameters
    .flatMap((item) => item.rules)
    .find((item) => item.rules_tech_id === id)
  if (!rule) rejectMock('Правило не найдено', [], 404)
  return rule
}
function addUi(draft: State, ruleId: string, input: UiInput, loc: (string | number)[]) {
  const rule = parent(draft, ruleId)
  if (
    input.journals_tech_id !== rule.journals_tech_id ||
    input.parameters_tech_id !== rule.parameters_tech_id
  )
    rejectMock('Неверная связь оформления', loc)
  if (!input.value.trim()) rejectMock('Введите значение свойства', [...loc, 'value'])
  if (!draft.catalogs.ui_attributes.some((item) => item.attr_key.key === input.attr_key))
    rejectMock('Неизвестное свойство', [...loc, 'attr_key'])
  if (
    draft.catalogs.ui_rules.some(
      (item) => item.rules_tech_id === ruleId && item.attr_key === input.attr_key
    )
  )
    rejectMock('Свойство уже существует', loc)
  draft.catalogs.ui_rules.push({
    ...input,
    rules_tech_id: ruleId,
    ui_rules_tech_id: takeId(draft)
  })
}
function addNotify(draft: State, ruleId: string, input: NotifyInput, loc: (string | number)[]) {
  const rule = parent(draft, ruleId)
  if (
    input.journals_tech_id !== rule.journals_tech_id ||
    input.parameters_tech_id !== rule.parameters_tech_id
  )
    rejectMock('Неверная связь уведомления', loc)
  if (!input.message_template.trim())
    rejectMock('Введите текст уведомления', [...loc, 'message_template'])
  draft.catalogs.notify_rules.push({
    ...input,
    rules_tech_id: ruleId,
    rule_notification_tech_id: takeId(draft)
  })
}
export const parameterRulesMockService = {
  async getCatalogs(journalId: string) {
    const fault = await beginMockRequest('catalogs')
    checkJournal(journalId)
    finishMockRequest(fault)
    return structuredClone(state.catalogs)
  },
  async getRules(journalId: string) {
    const fault = await beginMockRequest('rules')
    checkJournal(journalId)
    finishMockRequest(fault)
    return structuredClone(
      state.parameters
        .map((item) => ({
          ...item,
          rules: item.rules.filter((rule) => rule.journals_tech_id === journalId)
        }))
        .filter((item) => item.rules.length)
    )
  },
  async create(journalId: string, body: CreateRulesBody) {
    const fault = await beginMockRequest('post')
    checkJournal(journalId)
    const draft = structuredClone(state)
    body.parameter_rules.forEach(({ ui_rules, notify_rules, ...input }, index) => {
      const loc = ['parameter_rules', index]
      if (input.journals_tech_id !== journalId) rejectMock('Неверный журнал', loc)
      validateRule(input, draft.catalogs, draft.parameters, loc)
      const id = takeId(draft)
      let parameter = draft.parameters.find(
        (item) => item.parameters_tech_id === input.parameters_tech_id
      )
      if (!parameter) {
        const catalog = draft.catalogs.parameters.find(
          (item) => item.tech_id === input.parameters_tech_id
        )!
        parameter = {
          parameters_tech_id: catalog.tech_id,
          name: catalog.name,
          description: catalog.description,
          rules: []
        }
        draft.parameters.push(parameter)
      }
      parameter.rules.push({
        ...input,
        value: String(input.value),
        rules_tech_id: id,
        version: 1,
        prev_rules_tech_id: null
      })
      ui_rules.forEach((item, i) => addUi(draft, id, item, [...loc, 'ui_rules', i]))
      notify_rules.forEach((item, i) => addNotify(draft, id, item, [...loc, 'notify_rules', i]))
    })
    body.ui_rules.forEach((item, index) =>
      addUi(draft, item.rules_tech_id, item, ['ui_rules', index])
    )
    body.notify_rules.forEach((item, index) =>
      addNotify(draft, item.rules_tech_id, item, ['notify_rules', index])
    )
    state = draft
    finishMockRequest(fault)
    return 'ok'
  },
  async update(journalId: string, body: UpdateRulesBody) {
    const fault = await beginMockRequest('put')
    checkJournal(journalId)
    const draft = structuredClone(state)
    body.parameter_rules.forEach((input, index) => {
      const rule = parent(draft, input.rules_tech_id)
      validateRule(
        { ...rule, ...input },
        draft.catalogs,
        draft.parameters,
        ['parameter_rules', index],
        rule.rules_tech_id
      )
      Object.assign(rule, input, { value: String(input.value) })
    })
    body.ui_rules.forEach((input, index) => {
      const item = draft.catalogs.ui_rules.find(
        (value) => value.ui_rules_tech_id === input.ui_rules_tech_id
      )
      if (!item) rejectMock('Оформление не найдено', ['ui_rules', index], 404)
      if (!input.value.trim()) rejectMock('Введите значение свойства', ['ui_rules', index, 'value'])
      Object.assign(item, input)
    })
    body.notify_rules.forEach((input, index) => {
      const item = draft.catalogs.notify_rules.find(
        (value) => value.rule_notification_tech_id === input.rule_notification_tech_id
      )
      if (!item) rejectMock('Уведомление не найдено', ['notify_rules', index], 404)
      if (!input.message_template.trim())
        rejectMock('Введите текст уведомления', ['notify_rules', index, 'message_template'])
      Object.assign(item, input)
    })
    state = draft
    finishMockRequest(fault)
    return null
  },
  async delete(journalId: string, body: DeleteRulesBody) {
    const fault = await beginMockRequest('delete')
    checkJournal(journalId)
    const draft = structuredClone(state)
    body.parameter_rules.forEach((id) => parent(draft, id))
    body.ui_rules.forEach((id) => {
      if (!draft.catalogs.ui_rules.some((item) => item.ui_rules_tech_id === id))
        rejectMock('Оформление не найдено', [], 404)
    })
    body.notify_rules.forEach((id) => {
      if (!draft.catalogs.notify_rules.some((item) => item.rule_notification_tech_id === id))
        rejectMock('Уведомление не найдено', [], 404)
    })
    draft.parameters.forEach((item) => {
      item.rules = item.rules.filter((rule) => !body.parameter_rules.includes(rule.rules_tech_id))
    })
    draft.catalogs.ui_rules = draft.catalogs.ui_rules.filter(
      (item) =>
        !body.parameter_rules.includes(item.rules_tech_id) &&
        !body.ui_rules.includes(item.ui_rules_tech_id)
    )
    draft.catalogs.notify_rules = draft.catalogs.notify_rules.filter(
      (item) =>
        !body.parameter_rules.includes(item.rules_tech_id) &&
        !body.notify_rules.includes(item.rule_notification_tech_id)
    )
    state = draft
    finishMockRequest(fault)
    return null
  }
}
