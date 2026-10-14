'use client'

import { EditOutlined } from '@ant-design/icons'
import { Button, Empty, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { ParameterRow } from '../../../model/parameterRules'

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
  const columns: ColumnsType<ParameterRow> = [
    { title: 'ID', dataIndex: 'id', width: '8.3333rem', ellipsis: true },
    { title: 'Название', dataIndex: 'name', width: '11.4583rem' },
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
      locale={{
        emptyText: (
          <Empty
            description={
              <div>
                <span>Добавьте первый параметр, чтобы настроить правила отображения.</span>
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
