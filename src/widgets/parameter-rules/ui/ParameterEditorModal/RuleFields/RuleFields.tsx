'use client'
import { Alert, Flex, Form, Input, InputNumber, Select } from 'antd'
import type { DraftRule, RuleChange, RuleErrors } from '../../../model/parameterRuleDraft'
import type { RuleCatalogs } from '../../../model/parameterRules'
import styles from './RuleFields.module.css'
import { ResultFields } from './ResultFields'
interface Props {
  catalogs: RuleCatalogs
  identityLocked: boolean
  errors: RuleErrors
  rule: DraftRule
  disabled: boolean
  onChange(change: RuleChange, update: (rule: DraftRule) => DraftRule): void
}
export function RuleFields({ catalogs, identityLocked, errors, rule, disabled, onChange }: Props) {
  const fieldError = (field: string, fallback?: string) => errors.fields?.[field] ?? fallback
  return (
    <div className={styles.ruleFields}>
      {errors.server && <Alert type="error" title={errors.server} />}
      <Form.Item
        label="Название правила"
        required
        help={fieldError('name', errors.name)}
        validateStatus={fieldError('name', errors.name) ? 'error' : undefined}
      >
        <Input
          disabled={disabled}
          maxLength={120}
          value={rule.name}
          onChange={(event) =>
            onChange({ field: 'name' }, (current) => ({ ...current, name: event.target.value }))
          }
        />
      </Form.Item>
      <Form.Item
        label="Описание"
        help={fieldError('description')}
        validateStatus={fieldError('description') ? 'error' : undefined}
      >
        <Input
          disabled={disabled}
          maxLength={300}
          value={rule.description ?? ''}
          onChange={(event) =>
            onChange({ field: 'description' }, (current) => ({
              ...current,
              description: event.target.value
            }))
          }
        />
      </Form.Item>
      {errors.duplicate && <Alert type="error" title={errors.duplicate} />}
      <Form.Item
        label="Условие"
        required
        help={
          fieldError('functions_tech_id', errors.condition) ?? fieldError('value', errors.value)
        }
        validateStatus={
          fieldError('functions_tech_id', errors.condition) || fieldError('value', errors.value)
            ? 'error'
            : undefined
        }
      >
        <Flex className={styles.conditionControls} gap={8}>
          <Select
            className={styles.conditionOperator}
            disabled={disabled || identityLocked}
            placeholder="Знак"
            value={rule.functionId}
            options={catalogs.functions.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value: string) =>
              onChange({ field: 'functionId' }, (current) => ({ ...current, functionId: value }))
            }
          />
          <InputNumber
            className={styles.conditionValue}
            controls={false}
            disabled={disabled || identityLocked}
            value={Number.isFinite(rule.value) ? rule.value : null}
            onChange={(value) =>
              onChange({ field: 'value' }, (current) => ({ ...current, value: value ?? undefined }))
            }
          />
        </Flex>
      </Form.Item>
      <ResultFields
        catalogs={catalogs}
        rule={rule}
        errors={errors}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  )
}
