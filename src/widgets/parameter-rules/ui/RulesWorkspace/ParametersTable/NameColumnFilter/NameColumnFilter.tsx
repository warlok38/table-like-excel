'use client'

import { Button, Flex, Input } from 'antd'
import type { FilterDropdownProps } from 'antd/es/table/interface'

import styles from './NameColumnFilter.module.css'

type NameColumnFilterProps = FilterDropdownProps & {
  hasAppliedFilter: boolean
}

export function NameColumnFilter({
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
  hasAppliedFilter
}: NameColumnFilterProps) {
  return (
    <Flex vertical gap="0.4167rem" className={styles.filter}>
      <Input
        allowClear
        placeholder="Поиск по названию"
        value={String(selectedKeys[0] ?? '')}
        onChange={(event) => setSelectedKeys(event.target.value ? [event.target.value] : [])}
        onPressEnter={() => confirm()}
      />
      <Flex justify="space-between" gap="0.4167rem">
        <Button
          type="link"
          size="small"
          disabled={!selectedKeys.length && !hasAppliedFilter}
          onClick={() => clearFilters?.({ confirm: true, closeDropdown: true })}
        >
          Сбросить
        </Button>
        <Button type="primary" size="small" onClick={() => confirm()}>
          Найти
        </Button>
      </Flex>
    </Flex>
  )
}
