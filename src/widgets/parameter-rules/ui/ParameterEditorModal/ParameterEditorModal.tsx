'use client'
import { DeleteOutlined } from '@ant-design/icons'
import { Alert, App, Button, Flex, Modal, Typography } from 'antd'
import { useParameterEditorController } from '../../model/useParameterEditorController'
import type {
  RuleCatalogs,
  ParameterCatalogItem,
  ParameterConfiguration
} from '../../model/parameterRules'
import { ParameterEditorForm } from './ParameterEditorForm'
import { ParameterDetails } from '../ParameterDetails'
import { PendingDeletionsAlert } from './PendingDeletionsAlert'
import { ParameterRulesFeature } from './ParameterRulesFeature'
import styles from './ParameterEditorModal.module.css'
interface Props {
  ruleCatalogs: RuleCatalogs
  parameter?: ParameterCatalogItem
  parameterId: string
  selectionKey: string
  journalId: string
  author: string
  onBack?: () => void
  configuration?: ParameterConfiguration
  open: boolean
  isInteractionDisabled: boolean
  onClose(): void
  reload(): Promise<ParameterConfiguration>
  onSaved(): void
}
const editorFormId = 'parameter-editor-form'
export function ParameterEditorModal({
  ruleCatalogs,
  parameter,
  parameterId,
  selectionKey,
  journalId,
  author,
  onBack,
  configuration,
  open,
  isInteractionDisabled,
  onClose,
  reload,
  onSaved
}: Props) {
  const { modal } = App.useApp()
  const controller = useParameterEditorController({
    parameterId,
    selectionKey,
    parameter,
    journalId,
    author,
    configuration,
    ruleCatalogs,
    isInteractionDisabled,
    reload,
    onSaved
  })
  const requestLeave = (leave: () => void) => {
    if (controller.busy) return
    if (!controller.isDirty && !controller.syncRequired && !controller.uncertain) {
      leave()
      return
    }
    modal.confirm({
      title: 'Закрыть форму?',
      content: 'Несохранённые изменения будут потеряны. Уже сохранённые изменения останутся.',
      okText: 'Закрыть',
      cancelText: 'Продолжить редактирование',
      width: '21.6667rem',
      centered: true,
      onOk: leave
    })
  }
  const requestDelete = () => {
    if (controller.disabled) return
    modal.confirm({
      title: 'Удалить все правила параметра «' + (parameter?.name ?? parameterId) + '»?',
      content:
        'Все правила, значение по умолчанию, связанные оформление и уведомления будут удалены.',
      okText: 'Удалить все правила',
      cancelText: 'Отмена',
      width: '21.6667rem',
      okButtonProps: { danger: true },
      centered: true,
      onOk: controller.deleteAll
    })
  }
  return (
    <Modal
      className={styles.editorModal}
      closable={!controller.busy}
      centered
      destroyOnHidden
      footer={
        <div className={styles.modalFooter}>
          <div>
            <ParameterRulesFeature>
              {controller.hasSavedRules && (
                <Button
                  danger
                  disabled={controller.disabled}
                  icon={<DeleteOutlined />}
                  onClick={requestDelete}
                >
                  Удалить все правила
                </Button>
              )}
            </ParameterRulesFeature>
          </div>
          <Flex gap="0.4167rem">
            {onBack && (
              <Button disabled={controller.busy} onClick={() => requestLeave(onBack)}>
                Назад
              </Button>
            )}
            <Button disabled={controller.busy} onClick={() => requestLeave(onClose)}>
              Отмена
            </Button>
            <Button
              disabled={!controller.isDirty || controller.disabled}
              form={editorFormId}
              htmlType="submit"
              loading={controller.busy}
              type="primary"
            >
              Сохранить
            </Button>
          </Flex>
        </div>
      }
      mask={{ closable: false }}
      keyboard={!controller.busy}
      open={open}
      width="45.8333rem"
      title={
        <div className={styles.modalHeading}>
          <Typography.Title className={styles.modalTitle} level={4}>
            Правила параметра «{parameter?.name ?? parameterId}»
          </Typography.Title>
          <ParameterDetails parameter={parameter} />
        </div>
      }
      onCancel={() => requestLeave(onClose)}
    >
      {controller.status && (
        <Alert
          type="warning"
          title={controller.status}
          action={
            controller.syncRequired ? (
              <Button loading={controller.busy} onClick={controller.retry}>
                Повторить загрузку
              </Button>
            ) : undefined
          }
        />
      )}
      <ParameterRulesFeature>
        {controller.removed.length > 0 && (
          <PendingDeletionsAlert
            items={controller.removed}
            disabled={controller.disabled}
            onRestoreAll={controller.restoreAllRemoved}
          />
        )}
      </ParameterRulesFeature>
      <ParameterEditorForm
        ruleCatalogs={ruleCatalogs}
        parameter={parameter}
        configuration={configuration}
        controller={controller}
        formId={editorFormId}
        isInteractionDisabled={controller.disabled}
        open={open}
      />
    </Modal>
  )
}
