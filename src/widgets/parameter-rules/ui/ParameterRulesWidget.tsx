'use client'

import { App } from 'antd'
import { mockContext } from '../api/mock/parameterRulesData'

import { useParameterRulesController } from '../model/useParameterRulesController'
import { ParameterEditorModal } from './ParameterEditorModal'
import { RulesWorkspace } from './RulesWorkspace'
import { ParameterSelectionModal } from './ParameterSelectionModal'

export function ParameterRulesWidget() {
  const { message } = App.useApp()
  const controller = useParameterRulesController(message, mockContext.journalId)
  const view = controller.view

  return (
    <>
      <RulesWorkspace
        rows={controller.rows}
        isRefreshing={controller.isRefreshing}
        isInitialLoading={controller.isInitialLoading}
        hasInitialLoadError={controller.hasInitialLoadError}
        hasRefreshError={controller.hasRefreshError}
        canCreate={controller.canCreate}
        isInteractionDisabled={controller.isInteractionDisabled}
        onCreate={controller.openCreate}
        onEdit={controller.openEdit}
        onRetry={controller.retry}
      />
      {view.type === 'selection' && (
        <ParameterSelectionModal
          catalog={controller.catalog}
          rows={controller.rows}
          disabled={controller.isInteractionDisabled}
          onSelect={controller.selectParameter}
          onClose={controller.closeEditor}
        />
      )}
      {view.type === 'editor' && (
        <ParameterEditorModal
          key={view.parameterId}
          parameterId={view.parameterId}
          journalId={mockContext.journalId}
          author={mockContext.author}
          onBack={view.source === 'selection' ? controller.openCreate : undefined}
          ruleCatalogs={controller.ruleCatalogs}
          catalog={controller.catalog}
          configuration={view.configuration}
          open
          isInteractionDisabled={controller.isInteractionDisabled}

          onClose={controller.closeEditor}
          reload={() => controller.reloadConfiguration(view.parameterId)}
          onSaved={controller.saved}
        />
      )}
    </>
  )
}
