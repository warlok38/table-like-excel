'use client'

import { useEffect, useMemo, useState } from 'react'
import { App, Alert, Button, ConfigProvider, Empty, Table, Tooltip, Typography } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

import { createParameterRulesMockAdapter } from '../mocks/parameter-rules-adapter'
import type { ParameterConfiguration, ParameterRulesSnapshot } from '../model/parameter-rules'
import { ParameterEditorModal } from './ParameterEditorModal'
import styles from './parameter-rules.module.css'

interface ParameterRow {
  id: number
  name: string
  description: string
  updatedAt: string
  rulesCount: number
  configuration: ParameterConfiguration
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))

const formatRulesCount = (count: number) => {
  if (count === 1) return '1 правило'
  if (count > 1 && count < 5) return `${count} правила`
  return `${count} правил`
}

function ParameterRulesContent() {
  const adapter = useMemo(() => createParameterRulesMockAdapter(), [])
  const { message } = App.useApp()
  const [snapshot, setSnapshot] = useState<ParameterRulesSnapshot>({
    catalog: [],
    configurations: []
  })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingConfiguration, setEditingConfiguration] = useState<ParameterConfiguration>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    adapter
      .load()
      .then((loadedSnapshot) => {
        if (!active) return
        setSnapshot(loadedSnapshot)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setError('Не удалось загрузить параметры. Обновите страницу и попробуйте снова.')
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [adapter])

  const catalogById = useMemo(
    () => new Map(snapshot.catalog.map((parameter) => [parameter.id, parameter])),
    [snapshot.catalog]
  )
  const rows = useMemo<ParameterRow[]>(
    () =>
      snapshot.configurations.flatMap((configuration) => {
        const parameter = catalogById.get(configuration.parameterId)
        if (!parameter) return []
        return [
          {
            id: parameter.id,
            name: parameter.name,
            description: parameter.description,
            updatedAt: configuration.updatedAt,
            rulesCount: configuration.rules.length,
            configuration
          }
        ]
      }),
    [catalogById, snapshot.configurations]
  )

  const openCreate = () => {
    setEditingConfiguration(undefined)
    setEditorOpen(true)
  }
  const openEdit = (configuration: ParameterConfiguration) => {
    setEditingConfiguration(configuration)
    setEditorOpen(true)
  }

  const handleSave = async (
    configuration: Pick<ParameterConfiguration, 'parameterId' | 'rules'>
  ) => {
    setSaving(true)
    try {
      const nextSnapshot = await adapter.save(configuration)
      setSnapshot(nextSnapshot)
      setEditorOpen(false)
      message.success(editingConfiguration ? 'Изменения сохранены' : 'Параметр добавлен')
    } catch {
      message.error('Не удалось сохранить параметр. Изменения остались в форме.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (configuration: ParameterConfiguration) => {
    setSaving(true)
    try {
      const nextSnapshot = await adapter.delete(configuration.parameterId)
      setSnapshot(nextSnapshot)
      setEditorOpen(false)
      message.success('Параметр удалён')
    } catch (deleteError) {
      message.error('Не удалось удалить параметр. Попробуйте ещё раз.')
      throw deleteError
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<ParameterRow> = [
    { title: 'ID', dataIndex: 'id', width: 88 },
    { title: 'Название', dataIndex: 'name', width: 220 },
    { title: 'Описание', dataIndex: 'description' },
    {
      title: 'Дата обновления',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => formatDate(value)
    },
    {
      title: 'Правила',
      dataIndex: 'rulesCount',
      width: 110,
      render: (count: number) => formatRulesCount(count)
    },
    {
      title: '',
      key: 'actions',
      align: 'center',
      width: 64,
      render: (_, row) => (
        <Tooltip title="Редактировать">
          <Button
            aria-label={`Редактировать параметр ${row.name}`}
            icon={<EditOutlined />}
            onClick={() => openEdit(row.configuration)}
          />
        </Tooltip>
      )
    }
  ]

  return (
    <main className={styles.page}>
      <section className={styles.workspace}>
        <div className={styles.pageHeader}>
          <div>
            <Typography.Title>Настройка параметров</Typography.Title>
            <Typography.Text type="secondary">
              Настройте правила отображения значений параметров.
            </Typography.Text>
          </div>
          <Button
            disabled={status !== 'ready'}
            icon={<PlusOutlined />}
            size="large"
            type="primary"
            onClick={openCreate}
          >
            Добавить параметр
          </Button>
        </div>

        {status === 'error' && <Alert title={error} showIcon type="error" />}
        {status !== 'error' && (
          <Table<ParameterRow>
            columns={columns}
            dataSource={rows}
            loading={status === 'loading'}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <div className={styles.emptyDescription}>
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
        )}
      </section>

      <ParameterEditorModal
        catalog={snapshot.catalog}
        configuration={editingConfiguration}
        configurations={snapshot.configurations}
        open={editorOpen}
        saving={saving}
        onClose={() => setEditorOpen(false)}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    </main>
  )
}

export function ParameterRulesPage() {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#D9AD00',
          colorInfo: '#D9AD00',
          colorText: '#172033',
          controlHeight: 40,
          fontSize: 14,
          borderRadius: 6
        },
        components: {
          Button: {
            primaryColor: '#172033',
            colorPrimary: '#F5C400',
            colorPrimaryHover: '#E2B500',
            colorPrimaryActive: '#C79F00'
          },
          Table: {
            headerBg: '#F4F6F8',
            headerColor: '#344054'
          }
        }
      }}
    >
      <App>
        <ParameterRulesContent />
      </App>
    </ConfigProvider>
  )
}
