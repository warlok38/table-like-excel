'use client'

import { Modal, Select } from 'antd'

import type { ParameterCatalogItem, ParameterRow } from '../model/parameterRules'

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
        placeholder="Выберите параметр из справочника"
        filterOption={(input, option) =>
          (option?.searchName ?? '').toLocaleLowerCase().includes(input.toLocaleLowerCase())
        }
        options={catalog.map((parameter) => {
          const count = rows.find((item) => item.id === parameter.id)?.rulesCount ?? 0
          return {
            value: parameter.id,
            searchName: parameter.name,
            label: `${parameter.name} · ${count ? `Правил: ${count}` : 'Нет правил'}`
          }
        })}
        onChange={onSelect}
      />
    </Modal>
  )
}
