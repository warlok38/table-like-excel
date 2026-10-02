'use client'

import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Typography } from 'antd'

import type { ParameterRow } from '../../model/parameterRules'
import { ParametersTable } from './ParametersTable'
import styles from './RulesWorkspace.module.css'

type RulesWorkspaceProps = {
  rows: ParameterRow[]
  isRefreshing: boolean
  isInitialLoading: boolean
  hasInitialLoadError: boolean
  hasRefreshError: boolean
  canCreate: boolean
  isInteractionDisabled: boolean
  onCreate(): void
  onEdit(parameterId: string): void
  onRetry(): void
}

export function RulesWorkspace({
  rows,
  isRefreshing,
  isInitialLoading,
  hasInitialLoadError,
  hasRefreshError,
  canCreate,
  isInteractionDisabled,
  onCreate,
  onEdit,
  onRetry
}: RulesWorkspaceProps) {
  const retryAction = (
    <Button disabled={isRefreshing} size="small" onClick={onRetry}>
      Повторить
    </Button>
  )

  return (
    <main className={styles.page}>
      <section className={styles.workspace}>
        <div className={styles.pageHeader}>
          <div>
            <Typography.Title>Правила параметров</Typography.Title>
            <Typography.Text type="secondary">
              Настройте правила отображения и значения по умолчанию для параметров.
            </Typography.Text>
          </div>
          <Button
            disabled={!canCreate}
            icon={<PlusOutlined />}
            size="large"
            type="primary"
            onClick={onCreate}
          >
            Настроить параметр
          </Button>
        </div>

        {hasInitialLoadError && (
          <Alert
            className={styles.statusAlert}
            action={retryAction}
            description="Не удалось загрузить параметры. Попробуйте ещё раз."
            showIcon
            type="error"
          />
        )}
        {hasRefreshError && (
          <Alert
            className={styles.statusAlert}
            action={retryAction}
            description="Не удалось обновить параметры. Показаны последние сохранённые данные."
            showIcon
            type="warning"
          />
        )}
        {!hasInitialLoadError && (
          <ParametersTable
            isInteractionDisabled={isInteractionDisabled}
            isLoading={isInitialLoading}
            rows={rows}
            onEdit={onEdit}
          />
        )}
      </section>
    </main>
  )
}
