'use client'

import { Modal, Select } from 'antd'

import type { ParameterCatalogItem, ParameterConfiguration } from '../model/parameter-rules'

interface ParameterSelectionModalProps {
  catalog: ParameterCatalogItem[]
  configurations: ParameterConfiguration[]
  disabled: boolean
  onSelect(parameterId: number): void
  onClose(): void
}

export function ParameterSelectionModal({
  catalog,
  configurations,
  disabled,
  onSelect,
  onClose
}: ParameterSelectionModalProps) {
  return (
    <Modal open centered title="Выбор параметра" footer={null} onCancel={onClose}>
      <Select<number>
        style={{ width: '100%' }}
        showSearch
        disabled={disabled}
        placeholder="Выберите параметр из справочника"
        filterOption={(input, option) =>
          (option?.searchName ?? '').toLocaleLowerCase().includes(input.toLocaleLowerCase())
        }
        options={catalog.map((parameter) => {
          const count =
            configurations.find((item) => item.parameterId === parameter.id)?.rules.length ?? 0
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
