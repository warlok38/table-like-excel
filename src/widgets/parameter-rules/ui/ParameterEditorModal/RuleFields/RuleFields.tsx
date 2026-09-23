'use client'

import { Checkbox, Flex, Form, Input, InputNumber, Select } from 'antd'

import type { DraftRule, RuleErrors } from '../../../model/parameter-rule-draft'
import {
  fontWeightLabels,
  operatorLabels,
  type FontWeight,
  type RuleOperator,
  type RuleStyle
} from '../../../model/parameter-rules'
import styles from './RuleFields.module.css'

interface RuleFieldsProps {
  errors: RuleErrors
  rule: DraftRule
  disabled: boolean
  onChange(errorField: keyof RuleErrors | undefined, update: (rule: DraftRule) => DraftRule): void
}

export function RuleFields({ errors, rule, disabled, onChange }: RuleFieldsProps) {
  const updateStyle = (update: Partial<RuleStyle>) => {
    onChange('style', (current) => ({
      ...current,
      style: { ...current.style, ...update }
    }))
  }

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
      <Checkbox
        className={styles.defaultRuleCheckbox}
        checked={rule.isDefault}
        disabled={disabled}
        onChange={(event) =>
          onChange('condition', (current) => ({
            ...current,
            isDefault: event.target.checked
          }))
        }
      >
        Использовать по умолчанию (без условия)
      </Checkbox>

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
              disabled={disabled}
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
              disabled={disabled}
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

      <Form.Item
        help={errors.style}
        label="Оформление"
        required
        validateStatus={errors.style ? 'error' : undefined}
      >
        <div className={styles.styleControls}>
          <div className={styles.styleControl}>
            <Checkbox
              checked={Boolean(rule.style.textColor)}
              disabled={disabled}
              onChange={(event) =>
                updateStyle({ textColor: event.target.checked ? '#000000' : undefined })
              }
            >
              Цвет текста
            </Checkbox>
            <Input
              disabled={disabled || !rule.style.textColor}
              placeholder="Пусто"
              value={rule.style.textColor}
              onChange={(event) => updateStyle({ textColor: event.target.value || undefined })}
            />
          </div>
          <div className={styles.styleControl}>
            <Checkbox
              checked={Boolean(rule.style.backgroundColor)}
              disabled={disabled}
              onChange={(event) =>
                updateStyle({ backgroundColor: event.target.checked ? '#FFFFFF' : undefined })
              }
            >
              Цвет фона
            </Checkbox>
            <Input
              disabled={disabled || !rule.style.backgroundColor}
              placeholder="Пусто"
              value={rule.style.backgroundColor}
              onChange={(event) =>
                updateStyle({ backgroundColor: event.target.value || undefined })
              }
            />
          </div>
          <div className={styles.styleControl}>
            <Checkbox
              checked={Boolean(rule.style.fontWeight)}
              disabled={disabled}
              onChange={(event) =>
                updateStyle({ fontWeight: event.target.checked ? 'regular' : undefined })
              }
            >
              Начертание текста
            </Checkbox>
            <Select<FontWeight>
              allowClear
              disabled={disabled || !rule.style.fontWeight}
              options={(Object.keys(fontWeightLabels) as FontWeight[]).map((weight) => ({
                value: weight,
                label: fontWeightLabels[weight]
              }))}
              placeholder="Пусто"
              value={rule.style.fontWeight}
              onChange={(fontWeight) => updateStyle({ fontWeight })}
            />
          </div>
        </div>
      </Form.Item>
    </div>
  )
}
