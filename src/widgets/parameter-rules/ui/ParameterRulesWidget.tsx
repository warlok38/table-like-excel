'use client'

import { App } from 'antd'

import { useParameterRulesController } from '../model/use-parameter-rules-controller'
import { ParameterEditorModal } from './ParameterEditorModal'
import { RulesWorkspace } from './RulesWorkspace'

export function ParameterRulesWidget() {
  const { message } = App.useApp()
  const controller = useParameterRulesController(message)

  return (
    <>
      <RulesWorkspace
        rows={controller.rows}
        isInitialLoading={controller.isInitialLoading}
        hasInitialLoadError={controller.hasInitialLoadError}
        hasRefreshError={controller.hasRefreshError}
        canCreate={controller.canCreate}
        isInteractionDisabled={controller.isInteractionDisabled}
        onCreate={controller.openCreate}
        onEdit={controller.openEdit}
        onRetry={controller.retry}
      />
      <ParameterEditorModal
        catalog={controller.catalog}
        configuration={controller.editingConfiguration}
        configurations={controller.configurations}
        open={controller.isEditorOpen}
        isInteractionDisabled={controller.isInteractionDisabled}
        isMutationPending={controller.isMutationPending}
        onClose={controller.closeEditor}
        onDelete={controller.deleteConfiguration}
        onSave={controller.saveConfiguration}
      />
    </>
  )
}
