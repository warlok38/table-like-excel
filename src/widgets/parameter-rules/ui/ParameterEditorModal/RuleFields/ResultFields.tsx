'use client'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, Select } from 'antd'
import type { DraftRule, RuleErrors } from '../../../model/parameter-rule-draft'
import type { RuleCatalogs } from '../../../model/parameter-rules'
import styles from './RuleFields.module.css'

interface Props {
  catalogs: RuleCatalogs
  rule: DraftRule
  errors: RuleErrors
  disabled: boolean
  onChange(field: keyof RuleErrors | undefined, update: (rule: DraftRule) => DraftRule): void
}
export function ResultFields({ catalogs, rule, errors, disabled, onChange }: Props) {
  const available = catalogs.attributes.filter(
    (item) => !rule.uiRules.some((value) => value.key === item.key)
  )
  return (
    <>
      <Form.Item
        label="Стили"
        help={errors.result}
        validateStatus={errors.result ? 'error' : undefined}
      >
        <div className={styles.resultEditor}>
          <div className={styles.resultProperties}>
            {rule.uiRules.map((item, index) => (
              <ResultRow
                key={item.id ?? item.key}
                label={item.label || item.key}
                value={item.value}
                error={errors.fields?.['ui_rules.' + index + '.value']}
                disabled={disabled}
                placeholder="Введите значение"
                removeTitle="Удалить свойство"
                onChange={(value) =>
                  onChange('result', (current) => ({
                    ...current,
                    uiRules: current.uiRules.map((entry, i) =>
                      i === index ? { ...entry, value } : entry
                    )
                  }))
                }
                onRemove={() =>
                  onChange('result', (current) => ({
                    ...current,
                    uiRules: current.uiRules.filter((_, i) => i !== index)
                  }))
                }
              />
            ))}
          </div>
          <Select
            className={styles.addResultPropertySelect}
            value={null}
            size="small"
            disabled={disabled || !available.length}
            placeholder="Добавить стиль"
            showSearch
            optionFilterProp="label"
            options={available.map((item) => ({ value: item.key, label: item.name }))}
            onChange={(key: string) => {
              const attribute = available.find((item) => item.key === key)!
              onChange('result', (current) => ({
                ...current,
                uiRules: [
                  ...current.uiRules,
                  { key, name: attribute.name, label: attribute.name, description: '', value: '' }
                ]
              }))
            }}
          />
        </div>
      </Form.Item>
      <Form.Item label="Уведомления">
        <div className={styles.resultEditor}>
          <div className={styles.resultProperties}>
            {rule.notifications.map((item, index) => (
              <ResultRow
                key={item.id ?? index}
                label={
                  rule.notifications.length > 1
                    ? 'Текст уведомления ' + (index + 1)
                    : 'Текст уведомления'
                }
                value={item.text}
                error={errors.fields?.['notify_rules.' + index + '.message_template']}
                disabled={disabled}
                placeholder="Введите текст уведомления"
                removeTitle="Удалить уведомление"
                onChange={(text) =>
                  onChange('result', (current) => ({
                    ...current,
                    notifications: current.notifications.map((entry, i) =>
                      i === index ? { ...entry, text } : entry
                    )
                  }))
                }
                onRemove={() =>
                  onChange('result', (current) => ({
                    ...current,
                    notifications: current.notifications.filter((_, i) => i !== index)
                  }))
                }
              />
            ))}
          </div>
          <Button
            size="small"
            disabled={disabled}
            icon={<PlusOutlined />}
            onClick={() =>
              onChange('result', (current) => ({
                ...current,
                notifications: [...current.notifications, { text: '', description: '' }]
              }))
            }
          >
            Добавить уведомление
          </Button>
        </div>
      </Form.Item>
    </>
  )
}
interface ResultRowProps {
  label: string
  value: string
  error?: string
  disabled: boolean
  placeholder: string
  removeTitle: string
  onChange(value: string): void
  onRemove(): void
}
function ResultRow({
  label,
  value,
  error,
  disabled,
  placeholder,
  removeTitle,
  onChange,
  onRemove
}: ResultRowProps) {
  return (
    <div>
      <div className={styles.resultProperty}>
        <span>{label}</span>
        <Input
          className={styles.resultPropertyControl}
          status={error ? 'error' : undefined}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          className={styles.removeResultPropertyButton}
          title={removeTitle}
          type="text"
          disabled={disabled}
          icon={<CloseOutlined />}
          onClick={onRemove}
        />
      </div>
      {error && <div className={styles.resultPropertyError}>{error}</div>}
    </div>
  )
}
