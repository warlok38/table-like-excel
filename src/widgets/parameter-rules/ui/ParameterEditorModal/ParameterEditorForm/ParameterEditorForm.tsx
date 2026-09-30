'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Collapse, Form, Input, Tooltip, type CollapseProps } from 'antd'
import cn from 'classnames'

import type { ParameterEditorController } from '../../../model/use-parameter-editor-controller'
import { matchesRuleSearch } from '../../../model/rule-search'
import { getDraftRuleSummary, isDraftRuleChanged } from '../../../model/parameter-rule-draft'
import type { RuleCatalogs, ParameterConfiguration } from '../../../model/parameter-rules'
import { RuleFields } from '../RuleFields'
import styles from './ParameterEditorForm.module.css'

interface ParameterEditorFormProps {
  ruleCatalogs: RuleCatalogs
  configuration?: ParameterConfiguration
  controller: ParameterEditorController
  formId: string
  isInteractionDisabled: boolean
  open: boolean
}

export function ParameterEditorForm({
  ruleCatalogs,
  configuration,
  controller,
  formId,
  isInteractionDisabled,
  open
}: ParameterEditorFormProps) {
  const editorBodyRef = useRef<HTMLDivElement>(null)
  const addRuleButtonRef = useRef<HTMLButtonElement>(null)
  const addRuleButtonPreviousRect = useRef<DOMRect | null>(null)
  const ruleRefs = useRef(new Map<string, HTMLDivElement>())
  const [activeRuleKeys, setActiveRuleKeys] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const visibleRules = controller.draft.rules.filter((rule) =>
    matchesRuleSearch(
      controller.initialRulesByKey.get(rule.uiKey) ?? rule,
      ruleCatalogs,
      searchQuery
    )
  )
  const visibleRuleKeys = new Set(visibleRules.map((rule) => rule.uiKey))

  useEffect(() => {
    if (!open) return
    setSearchQuery('')
    setActiveRuleKeys(configuration ? [] : ['first-new'])
  }, [configuration, open])

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

    setSearchQuery('')
    setActiveRuleKeys([uiKey])
    revealTarget(() => ruleRefs.current.get(uiKey) ?? null)
  }

  const removeRule = (uiKey: string) => {
    if (isInteractionDisabled) return

    if (controller.draft.rules.length === 1) {
      captureAddRuleButtonPosition()
      setSearchQuery('')
    }

    controller.removeRule(uiKey)
    setActiveRuleKeys((current) => current.filter((key) => key !== uiKey))
  }

  const handleSave = async () => {
    const validationTarget = await controller.validateAndSave()
    if (!validationTarget) return

    if (validationTarget.type === 'parameter') return

    if (validationTarget.type === 'rules') {
      revealTarget(() => addRuleButtonRef.current)
      return
    }

    if (!visibleRuleKeys.has(validationTarget.uiKey)) setSearchQuery('')
    setActiveRuleKeys([validationTarget.uiKey])
    revealTarget(() => ruleRefs.current.get(validationTarget.uiKey) ?? null, true)
  }

  const collapseItems: CollapseProps['items'] = visibleRules.map((rule) => {
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
            <span>{getDraftRuleSummary(headingRule, ruleCatalogs)}</span>
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
            catalogs={ruleCatalogs}
            identityLocked={Boolean(initialRule)}
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
        <div
          className={cn(styles.rulesHeader, {
            [styles.rulesHeaderEmpty]: !controller.hasRules
          })}
        >
          {controller.hasRules && (
            <Input
              allowClear
              className={styles.ruleSearch}
              disabled={isInteractionDisabled}
              placeholder="Поиск по названию или агрегации…"
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onPressEnter={(event) => event.preventDefault()}
            />
          )}
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
        {controller.hasRules && collapseItems.length === 0 && (
          <div className={styles.searchEmpty}>
            <span>Правила не найдены</span>
            <Button disabled={isInteractionDisabled} onClick={() => setSearchQuery('')} type="link">
              Сбросить поиск
            </Button>
          </div>
        )}
        {collapseItems.length > 0 && (
          <Collapse
            activeKey={activeRuleKeys.filter((key) => visibleRuleKeys.has(key))}
            className={styles.rulesCollapse}
            collapsible={isInteractionDisabled ? 'disabled' : 'header'}
            items={collapseItems}
            onChange={(keys) => {
              const nextKeys = Array.isArray(keys) ? keys.map(String) : [String(keys)]
              setActiveRuleKeys((current) => [
                ...current.filter((key) => !visibleRuleKeys.has(key)),
                ...nextKeys
              ])
            }}
          />
        )}
      </Form>
    </div>
  )
}
