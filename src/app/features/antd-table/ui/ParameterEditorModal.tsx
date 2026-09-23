'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  App,
  Button,
  Collapse,
  Flex,
  Form,
  Modal,
  Select,
  Tooltip,
  Typography,
  type CollapseProps
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'

import {
  createEmptyRule,
  emptyDraftErrors,
  getDraftRuleSummary,
  isDraftRuleChanged,
  makeEditorDraft,
  toFormattingRules,
  validateEditorDraft,
  type DraftErrors,
  type DraftRule,
  type EditorDraft
} from '../model/parameter-rule-draft'
import { type ParameterCatalogItem, type ParameterConfiguration } from '../model/parameter-rules'
import styles from './parameter-rules.module.css'
import { RuleFields } from './RuleFields'

interface ParameterEditorModalProps {
  catalog: ParameterCatalogItem[]
  configurations: ParameterConfiguration[]
  configuration?: ParameterConfiguration
  open: boolean
  saving: boolean
  onClose(): void
  onDelete(configuration: ParameterConfiguration): Promise<void>
  onSave(configuration: Pick<ParameterConfiguration, 'parameterId' | 'rules'>): Promise<void>
}

const editorFormId = 'parameter-editor-form'

export function ParameterEditorModal({
  catalog,
  configurations,
  configuration,
  open,
  saving,
  onClose,
  onDelete,
  onSave
}: ParameterEditorModalProps) {
  const { modal } = App.useApp()
  const nextRuleKey = useRef(0)
  const editorBodyRef = useRef<HTMLDivElement>(null)
  const parameterFieldRef = useRef<HTMLDivElement>(null)
  const addRuleButtonRef = useRef<HTMLButtonElement>(null)
  const ruleRefs = useRef(new Map<string, HTMLDivElement>())
  const [draft, setDraft] = useState<EditorDraft>({ rules: [] })
  const [initialDraft, setInitialDraft] = useState<EditorDraft>({ rules: [] })
  const [activeRuleKeys, setActiveRuleKeys] = useState<string[]>([])
  const [errors, setErrors] = useState<DraftErrors>(emptyDraftErrors)
  const isEditing = Boolean(configuration)

  useEffect(() => {
    if (!open) return
    const nextDraft = makeEditorDraft(configuration)
    setDraft(nextDraft)
    setInitialDraft(nextDraft)
    setActiveRuleKeys([])
    setErrors(emptyDraftErrors)
  }, [configuration, open])

  const selectedParameter = useMemo(
    () => catalog.find((parameter) => parameter.id === draft.parameterId),
    [catalog, draft.parameterId]
  )
  const usedParameterIds = useMemo(
    () => new Set(configurations.map((item) => item.parameterId)),
    [configurations]
  )
  const initialRulesByKey = useMemo(
    () => new Map(initialDraft.rules.map((rule) => [rule.uiKey, rule])),
    [initialDraft.rules]
  )
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft)
  let modalTitle = 'Добавление параметра'
  if (isEditing) {
    modalTitle = selectedParameter
      ? `Редактирование параметра "${selectedParameter.name}"`
      : 'Редактирование параметра'
  }

  const scrollTargetIntoBody = (target: HTMLElement) => {
    const body = editorBodyRef.current?.parentElement
    if (!body) return

    const bodyRect = body.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const targetIsVisible = targetRect.top >= bodyRect.top && targetRect.bottom <= bodyRect.bottom

    if (!targetIsVisible) {
      body.scrollTo({
        behavior: 'smooth',
        top: body.scrollTop + targetRect.top - bodyRect.top - 16
      })
    }
  }

  const revealTarget = (target: () => HTMLElement | null, focusInvalidField = false) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const element = target()
        if (!element) return

        scrollTargetIntoBody(element)
        const focusTarget = focusInvalidField
          ? element.querySelector<HTMLElement>(
              '.ant-form-item-has-error input:not([disabled]), .ant-form-item-has-error button:not([disabled]), .ant-form-item-has-error [tabindex]:not([tabindex="-1"])'
            )
          : element

        focusTarget?.focus({ preventScroll: true })
      })
    })
  }

  const updateRule = (
    uiKey: string,
    errorField: keyof DraftErrors['byRule'][string] | undefined,
    update: (rule: DraftRule) => DraftRule
  ) => {
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
    const uiKey = `new-${nextRuleKey.current++}`
    setDraft((current) => ({ ...current, rules: [createEmptyRule(uiKey), ...current.rules] }))
    setActiveRuleKeys([uiKey])
    setErrors((current) => ({ ...current, rules: undefined }))
    revealTarget(() => ruleRefs.current.get(uiKey) ?? null)
  }

  const removeRule = (uiKey: string) => {
    setDraft((current) => ({
      ...current,
      rules: current.rules.filter((rule) => rule.uiKey !== uiKey)
    }))
    setActiveRuleKeys((current) => current.filter((key) => key !== uiKey))
    setErrors((current) => {
      const nextByRule = { ...current.byRule }
      delete nextByRule[uiKey]
      return { ...current, byRule: nextByRule }
    })
  }

  const handleSave = async () => {
    if (!isDirty || saving) return

    const nextErrors = validateEditorDraft(draft)
    setErrors(nextErrors)
    const firstInvalidRuleKey = draft.rules.find((rule) => nextErrors.byRule[rule.uiKey])?.uiKey

    if (nextErrors.parameter) {
      revealTarget(() => parameterFieldRef.current, true)
      return
    }

    if (nextErrors.rules) {
      revealTarget(() => addRuleButtonRef.current)
      return
    }

    if (firstInvalidRuleKey) {
      setActiveRuleKeys([firstInvalidRuleKey])
      revealTarget(() => ruleRefs.current.get(firstInvalidRuleKey) ?? null, true)
      return
    }

    await onSave({ parameterId: draft.parameterId!, rules: toFormattingRules(draft.rules) })
  }

  const requestClose = () => {
    if (saving) return
    if (!isDirty) {
      onClose()
      return
    }

    modal.confirm({
      title: 'Закрыть без сохранения?',
      content: 'Все изменения в параметре будут потеряны.',
      okText: 'Закрыть',
      cancelText: 'Продолжить редактирование',
      okButtonProps: { danger: true },
      centered: true,
      onOk: onClose
    })
  }

  const requestDelete = () => {
    if (!configuration || !selectedParameter) return
    modal.confirm({
      title: `Удалить параметр «${selectedParameter.name}»?`,
      content: `Будут удалены все правила: ${configuration.rules.length}. Это действие нельзя отменить.`,
      okText: 'Удалить параметр',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => onDelete(configuration)
    })
  }

  const collapseItems: CollapseProps['items'] = draft.rules.map((rule) => {
    const ruleErrors = errors.byRule[rule.uiKey] ?? {}
    const initialRule = initialRulesByKey.get(rule.uiKey)
    const ruleChanged = isDraftRuleChanged(rule, initialRule)
    const headingRule = initialRule ?? rule

    return {
      key: rule.uiKey,
      className: ruleChanged ? styles.changedRule : undefined,
      label: (
        <div className={styles.ruleHeading}>
          <span className={styles.ruleHeadingText}>
            <span className={styles.ruleTitleRow}>
              <strong>{headingRule.name.trim() || 'Новое правило'}</strong>
              {ruleChanged && <span className={styles.ruleChangeIndicator}>Изменено</span>}
            </span>
            <span>{getDraftRuleSummary(headingRule)}</span>
          </span>
        </div>
      ),
      extra: (
        <Tooltip title="Удалить правило">
          <Button
            aria-label="Удалить правило"
            danger
            disabled={saving}
            icon={<DeleteOutlined />}
            onClick={(event) => {
              event.stopPropagation()
              removeRule(rule.uiKey)
            }}
            type="text"
          />
        </Tooltip>
      ),
      children: (
        <div
          ref={(node) => {
            if (node) {
              ruleRefs.current.set(rule.uiKey, node)
            } else {
              ruleRefs.current.delete(rule.uiKey)
            }
          }}
        >
          <RuleFields
            errors={ruleErrors}
            rule={rule}
            saving={saving}
            onChange={(errorField, update) => updateRule(rule.uiKey, errorField, update)}
          />
        </div>
      )
    }
  })

  return (
    <Modal
      className={styles.editorModal}
      closable={!saving}
      centered
      destroyOnHidden
      footer={
        <div className={styles.modalFooter}>
          <div>
            {isEditing && (
              <Button danger disabled={saving} icon={<DeleteOutlined />} onClick={requestDelete}>
                Удалить параметр
              </Button>
            )}
          </div>
          <Flex gap={8}>
            <Button disabled={saving} onClick={requestClose}>
              Отмена
            </Button>
            <Button
              disabled={!isDirty || saving}
              form={editorFormId}
              htmlType="submit"
              loading={saving}
              type="primary"
            >
              {isEditing ? 'Сохранить' : 'Добавить'}
            </Button>
          </Flex>
        </div>
      }
      mask={{ closable: false }}
      keyboard={!saving}
      open={open}
      title={<Typography.Title level={4}>{modalTitle}</Typography.Title>}
      width={880}
      onCancel={requestClose}
    >
      <div ref={editorBodyRef} className={styles.editorBody}>
        <Form
          className={styles.editorForm}
          id={editorFormId}
          layout="vertical"
          onFinish={handleSave}
        >
          {!isEditing && (
            <div ref={parameterFieldRef}>
              <Form.Item
                help={errors.parameter}
                label="Параметр"
                required
                validateStatus={errors.parameter ? 'error' : undefined}
              >
                <Select<number>
                  disabled={saving}
                  options={catalog.map((parameter) => ({
                    value: parameter.id,
                    label: parameter.name,
                    disabled: usedParameterIds.has(parameter.id)
                  }))}
                  placeholder="Выберите параметр из справочника"
                  value={draft.parameterId}
                  onChange={(parameterId) => {
                    setDraft((current) => ({ ...current, parameterId }))
                    setErrors((current) => ({ ...current, parameter: undefined }))
                  }}
                />
              </Form.Item>
            </div>
          )}

          <div className={styles.rulesHeader}>
            <Typography.Title level={4}>Правила:</Typography.Title>
            <Button
              ref={addRuleButtonRef}
              className={styles.addRuleButton}
              disabled={saving}
              icon={<PlusOutlined />}
              size="small"
              onClick={addRule}
            >
              Добавить правило
            </Button>
          </div>

          {errors.rules && <div className={styles.rulesError}>{errors.rules}</div>}
          {collapseItems.length > 0 && (
            <Collapse
              activeKey={activeRuleKeys}
              className={styles.rulesCollapse}
              items={collapseItems}
              onChange={(keys) =>
                setActiveRuleKeys(Array.isArray(keys) ? keys.map(String) : [String(keys)])
              }
            />
          )}
        </Form>
      </div>
    </Modal>
  )
}
