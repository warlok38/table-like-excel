import type {
  ParameterConfiguration,
  ParameterRulesSnapshot,
  SaveParameterInput
} from '../../model/parameter-rules'
import { parameterCatalogMock, parameterConfigurationsMock } from './parameter-rules-data'

const requestDelayMs = 350

let configurations = cloneConfigurations(parameterConfigurationsMock)

export const parameterRulesMockService = {
  async getParameters(): Promise<ParameterRulesSnapshot> {
    await pause()
    return cloneSnapshot()
  },

  async saveParameter(configuration: SaveParameterInput): Promise<ParameterConfiguration> {
    await pause()

    const savedConfiguration: ParameterConfiguration = {
      ...configuration,
      updatedAt: new Date().toISOString(),
      rules: configuration.rules.map((rule) => ({
        ...rule,
        description: rule.description?.trim() || undefined,
        condition: rule.isDefault || !rule.condition ? undefined : { ...rule.condition },
        style: { ...rule.style }
      }))
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
    configurations = configurations.filter((item) => item.parameterId !== parameterId)
    return null
  }
}

function pause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, requestDelayMs))
}

function cloneSnapshot(): ParameterRulesSnapshot {
  return {
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
    rules: configuration.rules.map((rule) => ({
      ...rule,
      condition: rule.condition ? { ...rule.condition } : undefined,
      style: { ...rule.style }
    }))
  }
}
