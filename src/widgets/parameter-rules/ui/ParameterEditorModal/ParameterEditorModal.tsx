'use client'

import { useMemo } from 'react'
import { DeleteOutlined } from '@ant-design/icons'
import { App, Button, Flex, Modal, Typography } from 'antd'

import { useParameterEditorController } from '../../model/use-parameter-editor-controller'
import {
  type RuleCatalogs,
  type ParameterCatalogItem,
  type ParameterConfiguration
} from '../../model/parameter-rules'
import { ParameterEditorForm } from './ParameterEditorForm'
import styles from './ParameterEditorModal.module.css'

interface ParameterEditorModalProps {
  ruleCatalogs: RuleCatalogs
  catalog: ParameterCatalogItem[]
  parameterId: number
  onBack?: () => void
  configuration?: ParameterConfiguration
  open: boolean
  isInteractionDisabled: boolean
  isMutationPending: boolean
  onClose(): void
  onDelete(configuration: ParameterConfiguration): Promise<void>
  onSave(configuration: Pick<ParameterConfiguration, 'parameterId' | 'rules'>): Promise<void>
}

const editorFormId = 'parameter-editor-form'

export function ParameterEditorModal({
  ruleCatalogs,
  catalog,
  parameterId,
  onBack,
  configuration,
  open,
  isInteractionDisabled,
  isMutationPending,
  onClose,
  onDelete,
  onSave
}: ParameterEditorModalProps) {
  const { modal } = App.useApp()
  const controller = useParameterEditorController({
    parameterId,
    ruleCatalogs,
    configuration,
    open,
    isInteractionDisabled,
    onSave
  })
  const isEditing = Boolean(configuration)

  const selectedParameter = useMemo(
    () => catalog.find((parameter) => parameter.id === parameterId),
    [catalog, parameterId]
  )
  const modalTitle = `Правила параметра «${selectedParameter?.name ?? parameterId}»`

  const requestLeave = (leave: () => void) => {
    if (isMutationPending) return
    if (!controller.isDirty) {
      leave()
      return
    }

    modal.confirm({
      title: 'Закрыть без сохранения?',
      content: 'Все изменения в правилах будут потеряны.',
      okText: 'Закрыть',
      cancelText: 'Продолжить редактирование',
      okButtonProps: { danger: true },
      centered: true,
      onOk: leave
    })
  }

  const requestDelete = () => {
    if (isInteractionDisabled || !configuration || !selectedParameter) return
    modal.confirm({
      title: `Удалить все правила параметра «${selectedParameter.name}»?`,
      content: `Будут удалены все правила: ${configuration.rules.length}. Параметр останется в справочнике. Это действие нельзя отменить.`,
      okText: 'Удалить все правила',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => onDelete(configuration)
    })
  }

  return (
    <Modal
      className={styles.editorModal}
      closable={!isMutationPending}
      centered
      destroyOnHidden
      footer={
        <div className={styles.modalFooter}>
          <div>
            {isEditing && (
              <Button
                danger
                disabled={isInteractionDisabled}
                icon={<DeleteOutlined />}
                onClick={requestDelete}
              >
                Удалить все правила
              </Button>
            )}
          </div>
          <Flex gap={8}>
            {onBack && (
              <Button disabled={isMutationPending} onClick={() => requestLeave(onBack)}>
                Назад
              </Button>
            )}
            <Button disabled={isMutationPending} onClick={() => requestLeave(onClose)}>
              Отмена
            </Button>
            <Button
              disabled={!controller.isDirty || isInteractionDisabled}
              form={editorFormId}
              htmlType="submit"
              loading={isMutationPending}
              type="primary"
            >
              Сохранить
            </Button>
          </Flex>
        </div>
      }
      mask={{ closable: false }}
      keyboard={!isMutationPending}
      open={open}
      title={<Typography.Title level={4}>{modalTitle}</Typography.Title>}
      width={880}
      onCancel={() => requestLeave(onClose)}
    >
      <ParameterEditorForm
        ruleCatalogs={ruleCatalogs}
        configuration={configuration}
        controller={controller}
        formId={editorFormId}
        isInteractionDisabled={isInteractionDisabled}
        open={open}
      />
    </Modal>
  )
}
