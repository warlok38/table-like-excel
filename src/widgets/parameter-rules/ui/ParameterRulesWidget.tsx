'use client'

import { App, ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'

import { useParameterRulesController } from '../model/use-parameter-rules-controller'
import { ParameterEditorModal } from './ParameterEditorModal'
import { RulesWorkspace } from './RulesWorkspace'

function ParameterRulesContent() {
  const { message } = App.useApp()
  const controller = useParameterRulesController(message)

  return (
    <>
      <RulesWorkspace
        rows={controller.rows}
        isLoading={controller.isLoading}
        initialError={controller.initialError}
        refreshError={controller.refreshError}
        canCreate={controller.canCreate}
        actionsBlocked={controller.actionsBlocked}
        onCreate={controller.openCreate}
        onEdit={controller.openEdit}
        onRetry={controller.retry}
      />
      <ParameterEditorModal
        catalog={controller.catalog}
        configuration={controller.editingConfiguration}
        configurations={controller.configurations}
        open={controller.editorOpen}
        blocked={controller.actionsBlocked}
        saving={controller.saving}
        onClose={controller.closeEditor}
        onDelete={controller.deleteConfiguration}
        onSave={controller.saveConfiguration}
      />
    </>
  )
}

export function ParameterRulesWidget() {
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
