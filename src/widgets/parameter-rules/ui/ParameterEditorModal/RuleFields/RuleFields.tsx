'use client'

import { CloseOutlined } from '@ant-design/icons'
import { Button, Checkbox, Flex, Form, Input, InputNumber, Select, Tooltip } from 'antd'

import type { DraftRule, RuleErrors } from '../../../model/parameter-rule-draft'
import {
  fontWeightLabels,
  operatorLabels,
  type RuleCatalogs,
  type FontWeight,
  type RuleOperator,
  type RuleStyle
} from '../../../model/parameter-rules'
import { ColorValueSelect } from './ColorValueSelect'
import styles from './RuleFields.module.css'

interface RuleFieldsProps {
  catalogs: RuleCatalogs
  identityLocked: boolean
  errors: RuleErrors
  rule: DraftRule
  disabled: boolean
  onChange(errorField: keyof RuleErrors | undefined, update: (rule: DraftRule) => DraftRule): void
}

type ResultProperty = 'textColor' | 'backgroundColor' | 'fontWeight' | 'notificationText'

const resultPropertyLabels: Record<ResultProperty, string> = {
  textColor: 'Цвет текста',
  backgroundColor: 'Цвет фона',
  fontWeight: 'Начертание текста',
  notificationText: 'Текст уведомления'
}

const resultProperties = Object.keys(resultPropertyLabels) as ResultProperty[]

export function RuleFields({
  errors,
  rule,
  disabled,
  onChange,
  catalogs,
  identityLocked
}: RuleFieldsProps) {
  const updateStyle = (update: Partial<RuleStyle>) => {
    onChange('result', (current) => ({
      ...current,
      style: { ...current.style, ...update }
    }))
  }

  const hasResultProperty = (property: ResultProperty) => {
    if (property === 'notificationText') return rule.notificationText !== undefined
    return rule.style[property] !== undefined
  }

  const addResultProperty = (property: ResultProperty) => {
    if (property === 'notificationText') {
      onChange('result', (current) => ({ ...current, notificationText: '' }))
      return
    }

    const defaults: Required<RuleStyle> = {
      textColor: '',
      backgroundColor: '',
      fontWeight: 'regular'
    }
    updateStyle({ [property]: defaults[property] })
  }

  const removeResultProperty = (property: ResultProperty) => {
    if (property === 'notificationText') {
      onChange('result', (current) => ({ ...current, notificationText: undefined }))
      return
    }

    updateStyle({ [property]: undefined })
  }

  const availableResultProperties = resultProperties.filter(
    (property) => !hasResultProperty(property)
  )
  const hasSelectedResultProperties = availableResultProperties.length < resultProperties.length

  return (
    <div className={styles.ruleFields}>
      <Form.Item
        help={errors.name}
        label="Название правила"
        required
        validateStatus={errors.name ? 'error' : undefined}
      >
        <Input
          disabled={disabled}
          maxLength={120}
          placeholder="Например, Критическое значение"
          value={rule.name}
          onChange={(event) =>
            onChange('name', (current) => ({ ...current, name: event.target.value }))
          }
        />
      </Form.Item>
      <Form.Item label="Описание">
        <Input
          disabled={disabled}
          maxLength={300}
          placeholder="Необязательно"
          value={rule.description}
          onChange={(event) =>
            onChange(undefined, (current) => ({
              ...current,
              description: event.target.value
            }))
          }
        />
      </Form.Item>
      {(
        [
          ['aggregationLevelId', 'Уровень агрегации', catalogs.aggregationLevels],
          ['aggregationRuleId', 'Правило агрегации', catalogs.aggregationRules],
          ['planTypeId', 'Тип плана', catalogs.planTypes]
        ] as const
      ).map(([field, label, options]) => (
        <Form.Item
          key={field}
          label={label}
          required
          help={errors[field]}
          validateStatus={errors[field] ? 'error' : undefined}
        >
          <Select
            disabled={disabled || identityLocked}
            placeholder={label}
            value={rule[field]}
            options={options.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value: string) =>
              onChange(field, (current) => ({ ...current, [field]: value }))
            }
          />
        </Form.Item>
      ))}
      {errors.duplicate && <Form.Item validateStatus="error" help={errors.duplicate} />}
      <Checkbox
        className={styles.defaultRuleCheckbox}
        checked={rule.isDefault}
        disabled={disabled || identityLocked}
        onChange={(event) =>
          onChange('condition', (current) => ({
            ...current,
            isDefault: event.target.checked
          }))
        }
      >
        Значение по умолчанию
      </Checkbox>

      {rule.isDefault && (
        <Form.Item
          label="Значение по умолчанию"
          required
          help={errors.defaultValue}
          validateStatus={errors.defaultValue ? 'error' : undefined}
        >
          <InputNumber
            controls={false}
            disabled={disabled}
            placeholder="Введите значение"
            value={rule.defaultValue}
            onChange={(value) =>
              onChange('defaultValue', (current) => ({
                ...current,
                defaultValue: value ?? undefined
              }))
            }
          />
        </Form.Item>
      )}
      {!rule.isDefault && (
        <Form.Item
          help={errors.condition}
          label="Условие"
          required
          validateStatus={errors.condition ? 'error' : undefined}
        >
          <Flex className={styles.conditionControls} gap={8}>
            <Select<RuleOperator>
              className={styles.conditionOperator}
              disabled={disabled || identityLocked}
              options={(Object.keys(operatorLabels) as RuleOperator[]).map((operator) => ({
                value: operator,
                label: operatorLabels[operator]
              }))}
              placeholder="Знак"
              value={rule.condition?.operator}
              onChange={(operator) =>
                onChange('condition', (current) => ({
                  ...current,
                  condition: { operator, value: current.condition?.value }
                }))
              }
            />
            <InputNumber
              className={styles.conditionValue}
              controls={false}
              disabled={disabled || identityLocked}
              placeholder="Введите значение"
              value={rule.condition?.value}
              onChange={(value) =>
                onChange('condition', (current) => ({
                  ...current,
                  condition: current.condition
                    ? { ...current.condition, value: value ?? undefined }
                    : { value: value ?? undefined }
                }))
              }
            />
          </Flex>
        </Form.Item>
      )}

      {!rule.isDefault && (
        <Form.Item
          help={errors.result}
          label="Результат правила"
          required
          validateStatus={errors.result ? 'error' : undefined}
        >
          <div className={styles.resultEditor}>
            {hasSelectedResultProperties && (
              <div className={styles.resultProperties}>
                {hasResultProperty('textColor') && (
                  <ResultPropertyRow
                    disabled={disabled}
                    label={resultPropertyLabels.textColor}
                    onRemove={() => removeResultProperty('textColor')}
                  >
                    <ColorValueSelect
                      disabled={disabled}
                      options={catalogs.textColors}
                      value={rule.style.textColor}
                      onChange={(value) => updateStyle({ textColor: value })}
                    />
                  </ResultPropertyRow>
                )}
                {hasResultProperty('backgroundColor') && (
                  <ResultPropertyRow
                    disabled={disabled}
                    label={resultPropertyLabels.backgroundColor}
                    onRemove={() => removeResultProperty('backgroundColor')}
                  >
                    <ColorValueSelect
                      disabled={disabled}
                      options={catalogs.backgroundColors}
                      value={rule.style.backgroundColor}
                      onChange={(value) => updateStyle({ backgroundColor: value })}
                    />
                  </ResultPropertyRow>
                )}
                {hasResultProperty('fontWeight') && (
                  <ResultPropertyRow
                    disabled={disabled}
                    label={resultPropertyLabels.fontWeight}
                    onRemove={() => removeResultProperty('fontWeight')}
                  >
                    <Select<FontWeight>
                      disabled={disabled}
                      options={(Object.keys(fontWeightLabels) as FontWeight[]).map((weight) => ({
                        value: weight,
                        label: fontWeightLabels[weight]
                      }))}
                      value={rule.style.fontWeight}
                      onChange={(fontWeight) => updateStyle({ fontWeight })}
                    />
                  </ResultPropertyRow>
                )}
                {hasResultProperty('notificationText') && (
                  <ResultPropertyRow
                    disabled={disabled}
                    label={resultPropertyLabels.notificationText}
                    onRemove={() => removeResultProperty('notificationText')}
                  >
                    <Input
                      disabled={disabled}
                      placeholder="Введите текст уведомления"
                      value={rule.notificationText}
                      onChange={(event) =>
                        onChange('result', (current) => ({
                          ...current,
                          notificationText: event.target.value
                        }))
                      }
                    />
                  </ResultPropertyRow>
                )}
              </div>
            )}
            <Select<ResultProperty>
              className={styles.addResultPropertySelect}
              disabled={disabled || availableResultProperties.length === 0}
              listHeight={256}
              notFoundContent="Свойства не найдены"
              optionFilterProp="label"
              options={availableResultProperties.map((property) => ({
                value: property,
                label: resultPropertyLabels[property]
              }))}
              placeholder="Найти свойство"
              showSearch
              size="small"
              title={availableResultProperties.length === 0 ? 'Нет доступных свойств' : undefined}
              value={null}
              onChange={addResultProperty}
            />
          </div>
        </Form.Item>
      )}
    </div>
  )
}

interface ResultPropertyRowProps {
  children: React.ReactNode
  disabled: boolean
  label: string
  onRemove(): void
}

function ResultPropertyRow({ children, disabled, label, onRemove }: ResultPropertyRowProps) {
  return (
    <div className={styles.resultProperty}>
      <span className={styles.resultPropertyLabel}>{label}</span>
      <div className={styles.resultPropertyControl}>{children}</div>
      <Tooltip title="Удалить свойство">
        <Button
          className={styles.removeResultPropertyButton}
          disabled={disabled}
          icon={<CloseOutlined />}
          size="small"
          type="text"
          onClick={onRemove}
        />
      </Tooltip>
    </div>
  )
}
