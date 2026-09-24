'use client'

import { useMemo } from 'react'
import { DeleteOutlined } from '@ant-design/icons'
import { App, Button, Flex, Modal, Typography } from 'antd'

import { useParameterEditorController } from '../../model/use-parameter-editor-controller'
import { type ParameterCatalogItem, type ParameterConfiguration } from '../../model/parameter-rules'
import { ParameterEditorForm } from './ParameterEditorForm'
import styles from './ParameterEditorModal.module.css'

interface ParameterEditorModalProps {
  catalog: ParameterCatalogItem[]
  configurations: ParameterConfiguration[]
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
  catalog,
  configurations,
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
    configuration,
    open,
    isInteractionDisabled,
    onSave
  })
  const isEditing = Boolean(configuration)

  const selectedParameter = useMemo(
    () => catalog.find((parameter) => parameter.id === controller.draft.parameterId),
    [catalog, controller.draft.parameterId]
  )
  let modalTitle = 'Добавление параметра'
  if (isEditing) {
    modalTitle = selectedParameter
      ? `Редактирование параметра "${selectedParameter.name}"`
      : 'Редактирование параметра'
  }

  const requestClose = () => {
    if (isMutationPending) return
    if (!controller.isDirty) {
      onClose()
      return
    }

    modal.confirm({
      title: 'Закрыть без сохранения?',
      content: 'Все изменения в параметре будут потеряны.',
      okText: 'Закрыть',
      cancelText: 'Продолжить редактирование',
      okButtonProps: { danger: true },
      centered: true,
      onOk: onClose
    })
  }

  const requestDelete = () => {
    if (isInteractionDisabled || !configuration || !selectedParameter) return
    modal.confirm({
      title: `Удалить параметр «${selectedParameter.name}»?`,
      content: `Будут удалены все правила: ${configuration.rules.length}. Это действие нельзя отменить.`,
      okText: 'Удалить параметр',
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
                Удалить параметр
              </Button>
            )}
          </div>
          <Flex gap={8}>
            <Button disabled={isMutationPending} onClick={requestClose}>
              Отмена
            </Button>
            <Button
              disabled={!controller.isDirty || isInteractionDisabled}
              form={editorFormId}
              htmlType="submit"
              loading={isMutationPending}
              type="primary"
            >
              {isEditing ? 'Сохранить' : 'Добавить'}
            </Button>
          </Flex>
        </div>
      }
      mask={{ closable: false }}
      keyboard={!isMutationPending}
      open={open}
      title={<Typography.Title level={4}>{modalTitle}</Typography.Title>}
      width={880}
      onCancel={requestClose}
    >
      <ParameterEditorForm
        catalog={catalog}
        configuration={configuration}
        configurations={configurations}
        controller={controller}
        formId={editorFormId}
        isInteractionDisabled={isInteractionDisabled}
        open={open}
      />
    </Modal>
  )
}
