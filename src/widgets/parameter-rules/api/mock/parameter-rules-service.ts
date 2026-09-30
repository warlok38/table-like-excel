import {
  makeEditorDraft,
  validateEditorDraft,
  toFormattingRules
} from '../../model/parameter-rule-draft'

import type {
  ParameterConfiguration,
  ParameterRulesSnapshot,
  SaveParameterInput
} from '../../model/parameter-rules'
import {
  parameterCatalogMock,
  parameterConfigurationsMock,
  ruleCatalogsMock
} from './parameter-rules-data'

const requestDelayMs = 350
const failGetParameters = false
const failSaveParameter = false
const failDeleteParameter = false

let configurations = cloneConfigurations(parameterConfigurationsMock)

export const parameterRulesMockService = {
  async getParameters(): Promise<ParameterRulesSnapshot> {
    await pause()

    if (failGetParameters) {
      throw new Error('Тестовая ошибка загрузки параметров')
    }

    return cloneSnapshot()
  },

  async saveParameter(configuration: SaveParameterInput): Promise<ParameterConfiguration> {
    await pause()

    if (failSaveParameter) {
      throw new Error('Тестовая ошибка сохранения параметра')
    }

    const draft = makeEditorDraft({ ...configuration, updatedAt: '' })
    const errors = validateEditorDraft(draft, ruleCatalogsMock)
    if (
      !parameterCatalogMock.some((item) => item.id === configuration.parameterId) ||
      errors.parameter ||
      errors.rules ||
      Object.keys(errors.byRule).length
    ) {
      throw new Error('Проверьте заполнение и уникальность правил')
    }
    const savedConfiguration: ParameterConfiguration = {
      ...configuration,
      updatedAt: new Date().toISOString(),
      rules: toFormattingRules(draft.rules)
    }
    const existingIndex = configurations.findIndex(
      (item) => item.parameterId === configuration.parameterId
    )

    if (existingIndex === -1) {
      configurations = [savedConfiguration, ...configurations]
    } else {
      configurations = configurations.map((item, index) =>
        index === existingIndex ? savedConfiguration : item
      )
    }

    return cloneConfiguration(savedConfiguration)
  },

  async deleteParameter(parameterId: number): Promise<null> {
    await pause()

    if (failDeleteParameter) {
      throw new Error('Тестовая ошибка удаления параметра')
    }

    configurations = configurations.filter((item) => item.parameterId !== parameterId)
    return null
  }
}

function pause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, requestDelayMs))
}

function cloneSnapshot(): ParameterRulesSnapshot {
  return {
    ruleCatalogs: structuredClone(ruleCatalogsMock),
    catalog: parameterCatalogMock.map((parameter) => ({ ...parameter })),
    configurations: cloneConfigurations(configurations)
  }
}

function cloneConfigurations(source: readonly ParameterConfiguration[]): ParameterConfiguration[] {
  return source.map(cloneConfiguration)
}

function cloneConfiguration(configuration: ParameterConfiguration): ParameterConfiguration {
  return {
    ...configuration,
    rules: structuredClone(configuration.rules)
  }
}
