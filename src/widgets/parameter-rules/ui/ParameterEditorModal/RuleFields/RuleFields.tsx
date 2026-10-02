'use client'
import { Alert, Checkbox, Flex, Form, Input, InputNumber, Select } from 'antd'
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
      {(
        [
          [
            'aggregationLevelId',
            'Уровень агрегации',
            catalogs.aggregationLevels,
            'aggregation_levels_tech_id'
          ],
          [
            'aggregationRuleId',
            'Правило агрегации',
            catalogs.aggregationRules,
            'aggregation_rules_tech_id'
          ],
          ['planTypeId', 'Тип плана', catalogs.planTypes, 'plan_types_tech_id']
        ] as const
      ).map(([field, label, options, apiField]) => (
        <Form.Item
          key={field}
          label={label}
          required
          help={fieldError(apiField, errors[field])}
          validateStatus={fieldError(apiField, errors[field]) ? 'error' : undefined}
        >
          <Select
            disabled={disabled || identityLocked}
            placeholder={label}
            value={rule[field]}
            options={options.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value: string) =>
              onChange({ field }, (current) => ({ ...current, [field]: value }))
            }
          />
        </Form.Item>
      ))}
      {errors.duplicate && <Alert type="error" title={errors.duplicate} />}
      <Checkbox
        checked={rule.isDefault}
        disabled={disabled || identityLocked}
        onChange={(event) =>
          onChange({ field: 'isDefault' }, (current) => ({
            ...current,
            isDefault: event.target.checked
          }))
        }
      >
        Значение по умолчанию
      </Checkbox>
      <Form.Item
        label={rule.isDefault ? 'Значение по умолчанию' : 'Условие'}
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
          {!rule.isDefault && (
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
          )}
          <InputNumber
            className={styles.conditionValue}
            controls={false}
            disabled={disabled || (identityLocked && !rule.isDefault)}
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
