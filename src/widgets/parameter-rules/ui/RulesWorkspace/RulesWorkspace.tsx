'use client'

import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Typography } from 'antd'

import type { ParameterConfiguration, ParameterRow } from '../../model/parameter-rules'
import { ParametersTable } from './ParametersTable'
import styles from './RulesWorkspace.module.css'

type RulesWorkspaceProps = {
  rows: ParameterRow[]
  isLoading: boolean
  initialError: boolean
  refreshError: boolean
  canCreate: boolean
  actionsBlocked: boolean
  onCreate(): void
  onEdit(configuration: ParameterConfiguration): void
  onRetry(): void
}

export function RulesWorkspace({
  rows,
  isLoading,
  initialError,
  refreshError,
  canCreate,
  actionsBlocked,
  onCreate,
  onEdit,
  onRetry
}: RulesWorkspaceProps) {
  const retryAction = (
    <Button disabled={actionsBlocked} size="small" onClick={onRetry}>
      Повторить
    </Button>
  )

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
            disabled={!canCreate}
            icon={<PlusOutlined />}
            size="large"
            type="primary"
            onClick={onCreate}
          >
            Добавить параметр
          </Button>
        </div>

        {initialError && (
          <Alert
            className={styles.statusAlert}
            action={retryAction}
            description="Не удалось загрузить параметры. Попробуйте ещё раз."
            showIcon
            type="error"
          />
        )}
        {refreshError && (
          <Alert
            className={styles.statusAlert}
            action={retryAction}
            description="Не удалось обновить параметры. Показаны последние сохранённые данные."
            showIcon
            type="warning"
          />
        )}
        {!initialError && (
          <ParametersTable
            actionsBlocked={actionsBlocked}
            isLoading={isLoading}
            rows={rows}
            onEdit={onEdit}
          />
        )}
      </section>
    </main>
  )
}
