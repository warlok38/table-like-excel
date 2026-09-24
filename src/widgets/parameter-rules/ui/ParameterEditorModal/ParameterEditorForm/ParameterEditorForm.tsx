'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Collapse, Form, Select, Tooltip, Typography, type CollapseProps } from 'antd'
import cn from 'classnames'

import type { ParameterEditorController } from '../../../model/use-parameter-editor-controller'
import { getDraftRuleSummary, isDraftRuleChanged } from '../../../model/parameter-rule-draft'
import type { ParameterCatalogItem, ParameterConfiguration } from '../../../model/parameter-rules'
import { RuleFields } from '../RuleFields'
import styles from './ParameterEditorForm.module.css'

interface ParameterEditorFormProps {
  catalog: ParameterCatalogItem[]
  configuration?: ParameterConfiguration
  configurations: ParameterConfiguration[]
  controller: ParameterEditorController
  formId: string
  isInteractionDisabled: boolean
  open: boolean
}

export function ParameterEditorForm({
  catalog,
  configuration,
  configurations,
  controller,
  formId,
  isInteractionDisabled,
  open
}: ParameterEditorFormProps) {
  const editorBodyRef = useRef<HTMLDivElement>(null)
  const parameterFieldRef = useRef<HTMLDivElement>(null)
  const addRuleButtonRef = useRef<HTMLButtonElement>(null)
  const addRuleButtonPreviousRect = useRef<DOMRect | null>(null)
  const ruleRefs = useRef(new Map<string, HTMLDivElement>())
  const [activeRuleKeys, setActiveRuleKeys] = useState<string[]>([])
  const isEditing = Boolean(configuration)

  useEffect(() => {
    if (!open) return
    setActiveRuleKeys([])
  }, [configuration, open])

  const usedParameterIds = useMemo(
    () => new Set(configurations.map((item) => item.parameterId)),
    [configurations]
  )

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

  const captureAddRuleButtonPosition = () => {
    addRuleButtonPreviousRect.current = addRuleButtonRef.current?.getBoundingClientRect() ?? null
  }

  useLayoutEffect(() => {
    const button = addRuleButtonRef.current
    const previousRect = addRuleButtonPreviousRect.current
    addRuleButtonPreviousRect.current = null

    if (!button || !previousRect) return

    const nextRect = button.getBoundingClientRect()
    const offsetX = previousRect.left - nextRect.left
    const offsetY = previousRect.top - nextRect.top
    const scaleX = previousRect.width / nextRect.width
    const scaleY = previousRect.height / nextRect.height
    const animation = button.animate(
      [
        { transform: `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})` },
        { transform: 'translate(0, 0) scale(1, 1)' }
      ],
      {
        duration: 280,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    )

    return () => animation.cancel()
  }, [controller.hasRules])

  const addRule = () => {
    if (isInteractionDisabled) return

    if (!controller.hasRules) {
      captureAddRuleButtonPosition()
    }

    const uiKey = controller.addRule()
    if (!uiKey) return

    setActiveRuleKeys([uiKey])
    revealTarget(() => ruleRefs.current.get(uiKey) ?? null)
  }

  const removeRule = (uiKey: string) => {
    if (isInteractionDisabled) return

    if (controller.draft.rules.length === 1) {
      captureAddRuleButtonPosition()
    }

    controller.removeRule(uiKey)
    setActiveRuleKeys((current) => current.filter((key) => key !== uiKey))
  }

  const handleSave = async () => {
    const validationTarget = await controller.validateAndSave()
    if (!validationTarget) return

    if (validationTarget.type === 'parameter') {
      revealTarget(() => parameterFieldRef.current, true)
      return
    }

    if (validationTarget.type === 'rules') {
      revealTarget(() => addRuleButtonRef.current)
      return
    }

    setActiveRuleKeys([validationTarget.uiKey])
    revealTarget(() => ruleRefs.current.get(validationTarget.uiKey) ?? null, true)
  }

  const collapseItems: CollapseProps['items'] = controller.draft.rules.map((rule) => {
    const ruleErrors = controller.errors.byRule[rule.uiKey] ?? {}
    const initialRule = controller.initialRulesByKey.get(rule.uiKey)
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
            danger
            disabled={isInteractionDisabled}
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
            disabled={isInteractionDisabled}
            errors={ruleErrors}
            rule={rule}
            onChange={(errorField, update) => controller.updateRule(rule.uiKey, errorField, update)}
          />
        </div>
      )
    }
  })

  return (
    <div ref={editorBodyRef} className={styles.editorBody}>
      <Form className={styles.editorForm} id={formId} layout="vertical" onFinish={handleSave}>
        {!isEditing && (
          <div ref={parameterFieldRef}>
            <Form.Item
              help={controller.errors.parameter}
              label="Параметр"
              required
              validateStatus={controller.errors.parameter ? 'error' : undefined}
            >
              <Select<number>
                disabled={isInteractionDisabled}
                options={catalog.map((parameter) => ({
                  value: parameter.id,
                  label: parameter.name,
                  disabled: usedParameterIds.has(parameter.id)
                }))}
                placeholder="Выберите параметр из справочника"
                value={controller.draft.parameterId}
                onChange={controller.setParameterId}
              />
            </Form.Item>
          </div>
        )}

        <div
          className={cn(styles.rulesHeader, {
            [styles.rulesHeaderEmpty]: !controller.hasRules
          })}
        >
          <Typography.Title level={5}>Правила:</Typography.Title>
          <Button
            ref={addRuleButtonRef}
            className={cn(styles.addRuleButton, {
              [styles.addRuleButtonEmpty]: !controller.hasRules
            })}
            disabled={isInteractionDisabled}
            icon={<PlusOutlined />}
            size={controller.hasRules ? 'small' : 'middle'}
            onClick={addRule}
          >
            Добавить правило
          </Button>
        </div>

        {controller.errors.rules && (
          <div className={styles.rulesError}>{controller.errors.rules}</div>
        )}
        {collapseItems.length > 0 && (
          <Collapse
            activeKey={activeRuleKeys}
            className={styles.rulesCollapse}
            collapsible={isInteractionDisabled ? 'disabled' : 'header'}
            items={collapseItems}
            onChange={(keys) =>
              setActiveRuleKeys(Array.isArray(keys) ? keys.map(String) : [String(keys)])
            }
          />
        )}
      </Form>
    </div>
  )
}
