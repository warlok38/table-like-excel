'use client'

import { useState } from 'react'
import { EditOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { ParameterRow } from '../../../model/parameterRules'
import { NameColumnFilter } from './NameColumnFilter'

function formatRulesLabel(count: number): string {
  return 'Правила: ' + count
}

type ParametersTableProps = {
  rows: ParameterRow[]
  isLoading: boolean
  isInteractionDisabled: boolean
  onEdit(parameterId: string): void
}

export function ParametersTable({
  rows,
  isLoading,
  isInteractionDisabled,
  onEdit
}: ParametersTableProps) {
  const [hasNameFilter, setHasNameFilter] = useState(false)
  const columns: ColumnsType<ParameterRow> = [
    { title: 'ID', dataIndex: 'id', width: '8.3333rem', ellipsis: true },
    {
      title: 'Название',
      dataIndex: 'name',
      width: '11.4583rem',
      filterDropdown: (props) => <NameColumnFilter {...props} hasAppliedFilter={hasNameFilter} />,
      filterIcon: <SearchOutlined />,
      onFilter: (value, row) =>
        row.name.toLocaleLowerCase().includes(String(value).trim().toLocaleLowerCase())
    },
    { title: 'Описание', dataIndex: 'description' },
    {
      title: 'Правила',
      dataIndex: 'rulesCount',
      width: '5.7292rem',
      render: (count: number) => formatRulesLabel(count)
    },
    {
      title: '',
      key: 'actions',
      align: 'center',
      width: '3.3333rem',
      render: (_, row) => (
        <Tooltip title="Редактировать">
          <Button
            disabled={isInteractionDisabled}
            icon={<EditOutlined />}
            onClick={() => onEdit(row.id)}
          />
        </Tooltip>
      )
    }
  ]

  return (
    <Table<ParameterRow>
      columns={columns}
      dataSource={rows}
      loading={isLoading}
      onChange={(_, filters) => setHasNameFilter(Boolean(filters.name?.length))}
      locale={{
        emptyText:
          isLoading && rows.length === 0 ? (
            'Загружаем данные...'
          ) : (
            <Empty
              description={
                <div>
                  <span>
                    {rows.length
                      ? 'По вашему запросу ничего не найдено.'
                      : 'Добавьте первый параметр, чтобы настроить правила отображения.'}
                  </span>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
      }}
      pagination={false}
      rowKey="id"
      scroll={{ x: '46.875rem' }}
      size="small"
    />
  )
}
