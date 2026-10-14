import type {
  CreateRulesBody,
  UpdateRulesBody,
  DeleteRulesBody,
  UiInput,
  NotifyInput,
  RuleDto,
  ParameterDto
} from '../contracts'
import { catalogsMock, parametersMock, mockContext } from './parameterRulesData'
import { reservedIds } from './reservedIds'
import { rejectMock, validateRule } from './mockValidation'
import { beginMockRequest, finishMockRequest } from './mockFaults'
import { getRulesParameterSelectionKey } from '../parameterRulesAdapter'
import { getMockParameterContext } from './parameterRulesContext'

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
function parent(draft: State, id: string): { parameter: ParameterDto; rule: RuleDto } {
  for (const parameter of draft.parameters) {
    const rule = parameter.rules.find((item) => item.rules_tech_id === id)
    if (rule) return { parameter, rule }
  }
  return rejectMock('Правило не найдено', [], 404)
}
function addUi(draft: State, ruleId: string, input: UiInput, loc: (string | number)[]) {
  const { parameter } = parent(draft, ruleId)
  if (
    input.journals_tech_id !== parameter.journals_tech_id ||
    input.parameters_tech_id !== parameter.parameters_tech_id
  )
    rejectMock('Неверная связь оформления', loc)
  if (!input.value.trim()) rejectMock('Введите значение свойства', [...loc, 'value'])
  if (!draft.catalogs.ui_attributes.some((item) => item.attr_key === input.attr_key))
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
    ui_rules_tech_id: takeId(draft),
    is_active: true
  })
}
function addNotify(draft: State, ruleId: string, input: NotifyInput, loc: (string | number)[]) {
  const { parameter } = parent(draft, ruleId)
  if (
    input.journals_tech_id !== parameter.journals_tech_id ||
    input.parameters_tech_id !== parameter.parameters_tech_id
  )
    rejectMock('Неверная связь уведомления', loc)
  if (!input.message_template.trim())
    rejectMock('Введите текст уведомления', [...loc, 'message_template'])
  draft.catalogs.notify_rules.push({
    ...input,
    rules_tech_id: ruleId,
    rule_notification_tech_id: takeId(draft),
    is_active: true
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
        .filter((item) => item.journals_tech_id === journalId)
        .filter((item) => item.rules.length || item.default_rule !== null)
    )
  },
  async create(journalId: string, body: CreateRulesBody) {
    const fault = await beginMockRequest('post')
    checkJournal(journalId)
    const draft = structuredClone(state)
    if (!body.parameter_rules.length && !body.ui_rules.length && !body.notify_rules.length)
      rejectMock('Добавьте хотя бы одно правило')
    body.parameter_rules.forEach((input, index) => {
      const loc = ['parameter_rules', index]
      if (input.journals_tech_id !== journalId) rejectMock('Неверный журнал', loc)
      const context = getMockParameterContext(input, draft.catalogs, loc)
      const selectionKey = getRulesParameterSelectionKey(context)
      if ('default_value' in input) {
        if (typeof input.name !== 'string' || !input.name.trim())
          rejectMock('Введите название правила', [...loc, 'name'])
        if (!Number.isFinite(input.default_value))
          rejectMock('Укажите число', [...loc, 'default_value'])
      } else validateRule(input, draft.catalogs, draft.parameters, loc, selectionKey)
      let parameter = draft.parameters.find(
        (item) =>
          item.journals_tech_id === journalId &&
          getRulesParameterSelectionKey(item) === selectionKey
      )
      if (!parameter) {
        parameter = {
          ...context,
          default_rule: null,
          rules: []
        }
        draft.parameters.push(parameter)
      }
      if ('default_value' in input) {
        if (parameter.default_rule)
          rejectMock('Значение по умолчанию уже существует', [...loc, 'default_value'])
        parameter.default_rule = { id: takeId(draft), value: input.default_value }
        return
      }
      const { ui_rules, notify_rules } = input
      const id = takeId(draft)
      parameter.rules.push({
        name: input.name,
        description: input.description,
        created_by: input.created_by,
        functions_tech_id: input.functions_tech_id,
        ...(input.scales_tech_id === undefined ? {} : { scales_tech_id: input.scales_tech_id }),
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
      const defaultRule = draft.parameters.find(
        (item) => item.default_rule?.id === input.rules_tech_id
      )?.default_rule
      if (defaultRule) {
        if (!Number.isFinite(input.value))
          rejectMock('Укажите число', ['parameter_rules', index, 'value'])
        defaultRule.value = input.value
        return
      }
      const { parameter, rule } = parent(draft, input.rules_tech_id)
      if (input.name === undefined || input.description === undefined)
        rejectMock('Укажите название и описание правила', ['parameter_rules', index])
      validateRule(
        { ...parameter, ...rule, ...input },
        draft.catalogs,
        draft.parameters,
        ['parameter_rules', index],
        getRulesParameterSelectionKey(parameter),
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
    body.parameter_rules.forEach((id, index) => {
      const parameter = draft.parameters.find((item) => item.default_rule?.id === id)
      if (parameter) parameter.default_rule = null
      else if (
        !draft.parameters.some((item) => item.rules.some((rule) => rule.rules_tech_id === id))
      )
        rejectMock('Правило не найдено', ['parameter_rules', index], 404)
    })
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
