'use client'

import { App } from 'antd'

import { useParameterRulesController } from '../model/use-parameter-rules-controller'
import { ParameterEditorModal } from './ParameterEditorModal'
import { RulesWorkspace } from './RulesWorkspace'
import { ParameterSelectionModal } from './ParameterSelectionModal'

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
      {controller.view.type === 'selection' && (
        <ParameterSelectionModal
          catalog={controller.catalog}
          configurations={controller.configurations}
          disabled={controller.isInteractionDisabled}
          onSelect={controller.selectParameter}
          onClose={controller.closeEditor}
        />
      )}
      {controller.view.type === 'editor' && (
        <ParameterEditorModal
          key={controller.view.parameterId}
          parameterId={controller.view.parameterId}
          onBack={controller.view.source === 'selection' ? controller.openCreate : undefined}
          ruleCatalogs={controller.ruleCatalogs}
          catalog={controller.catalog}
          configuration={controller.view.configuration}
          open
          isInteractionDisabled={controller.isInteractionDisabled}
          isMutationPending={controller.isMutationPending}
          onClose={controller.closeEditor}
          onDelete={controller.deleteConfiguration}
          onSave={controller.saveConfiguration}
        />
      )}
    </>
  )
}
