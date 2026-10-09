'use client'

import { Modal, Select } from 'antd'

import type { ParameterCatalogItem, ParameterRow } from '../model/parameterRules'
import styles from './ParameterSelectionModal.module.css'

// Reserve space for every value and split the remaining width between long values.
const shortDetailLength = 16

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
            { item: parameter.planType, missing: 'План не задан' },
            { item: parameter.aggregationRule, missing: 'Агрегация не задана' },
            { item: parameter.shift, missing: 'Смена не задана' },
            { item: parameter.aggregationLevel, missing: 'Уровень не задан' }
          ]
          const hasLongDetails = details.some(
            ({ item, missing }) => (item?.name ?? missing).length > shortDetailLength
          )
          return {
            value: parameter.id,
            searchFields: [
              parameter.name,
              parameter.id,
              ...details.flatMap(({ item }) => [item?.name, item?.id])
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
                <div className={styles.details}>
                  {details.map(({ item, missing }) => {
                    const value = item?.name ?? missing
                    const isLong = value.length > shortDetailLength
                    let flex: string | undefined
                    if (hasLongDetails) {
                      flex = isLong ? '1 1 0' : '0 1 auto'
                    }
                    return (
                      <span
                        className={styles.detail}
                        key={missing}
                        style={{ flex, minWidth: hasLongDetails ? 80 : undefined }}
                      >
                        <span className={styles.detailValue} title={value}>
                          {value}
                        </span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          }
        })}
        onChange={onSelect}
      />
    </Modal>
  )
}
