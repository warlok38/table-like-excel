'use client'

import { Modal, Select } from 'antd'

import type { ParameterCatalogItem, ParameterRow } from '../model/parameterRules'
import { ParameterDetails } from './ParameterDetails'
import styles from './ParameterSelectionModal.module.css'

interface ParameterSelectionModalProps {
  catalog: ParameterCatalogItem[]
  rows: ParameterRow[]
  disabled: boolean
  onSelect(parameterId: string): void
  onClose(): void
}

export function ParameterSelectionModal({
  catalog,
  rows,
  disabled,
  onSelect,
  onClose
}: ParameterSelectionModalProps) {
  return (
    <Modal open centered title="Выбор параметра" footer={null} onCancel={onClose}>
      <Select<string>
        style={{ width: '100%' }}
        showSearch
        disabled={disabled}
        popupClassName={styles.dropdown}
        placeholder="Выберите параметр из справочника"
        filterOption={(input, option) => {
          const fields = option?.searchFields ?? []
          const words = input.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean)
          return words.every((word) =>
            fields.some((field: string) => field.toLocaleLowerCase('ru').includes(word))
          )
        }}
        options={catalog.map((parameter) => {
          const count = rows.find((item) => item.id === parameter.id)?.rulesCount ?? 0
          const details = [
            parameter.planType,
            parameter.aggregationRule,
            parameter.shift,
            parameter.aggregationLevel
          ]
          return {
            value: parameter.id,
            searchFields: [
              parameter.name,
              parameter.id,
              ...details.flatMap((item) => [item?.name, item?.id])
            ].filter((value): value is string => Boolean(value)),
            label: (
              <div className={styles.option}>
                <div className={styles.header}>
                  <span className={styles.name} title={parameter.name}>
                    {parameter.name}
                  </span>
                  <span className={styles.count}>
                    {count ? (
                      <>
                        Правил: <span className={styles.countValue}>{count}</span>
                      </>
                    ) : (
                      'Нет правил'
                    )}
                  </span>
                </div>
                <ParameterDetails parameter={parameter} />
              </div>
            )
          }
        })}
        onChange={onSelect}
      />
    </Modal>
  )
}
