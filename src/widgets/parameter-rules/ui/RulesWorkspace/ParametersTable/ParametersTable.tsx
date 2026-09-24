'use client'

import { EditOutlined } from '@ant-design/icons'
import { Button, Empty, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { formatParameterUpdatedAt, formatRulesLabel } from '../../../lib/parameter-rules-format'
import type { ParameterConfiguration, ParameterRow } from '../../../model/parameter-rules'

type ParametersTableProps = {
  rows: ParameterRow[]
  isLoading: boolean
  isInteractionDisabled: boolean
  onEdit(configuration: ParameterConfiguration): void
}

export function ParametersTable({
  rows,
  isLoading,
  isInteractionDisabled,
  onEdit
}: ParametersTableProps) {
  const columns: ColumnsType<ParameterRow> = [
    { title: 'ID', dataIndex: 'id', width: 88 },
    { title: 'Название', dataIndex: 'name', width: 220 },
    { title: 'Описание', dataIndex: 'description' },
    {
      title: 'Дата обновления',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => formatParameterUpdatedAt(value)
    },
    {
      title: 'Правила',
      dataIndex: 'rulesCount',
      width: 110,
      render: (count: number) => formatRulesLabel(count)
    },
    {
      title: '',
      key: 'actions',
      align: 'center',
      width: 64,
      render: (_, row) => (
        <Tooltip title="Редактировать">
          <Button
            disabled={isInteractionDisabled}
            icon={<EditOutlined />}
            onClick={() => onEdit(row.configuration)}
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
                <strong>Нет настроенных параметров</strong>
                <span>Добавьте первый параметр, чтобы настроить правила отображения.</span>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )
      }}
      pagination={false}
      rowKey="id"
      scroll={{ x: 900 }}
      size="small"
    />
  )
}
