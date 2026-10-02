import type { CatalogsDto, ParameterDto } from '../contracts'

export const mockContext = { journalId: '25f942aa-a952-44b3-ae2a-fd285e9b5c5d', author: 'dev_user' }
const journal = mockContext.journalId
export const catalogsMock: CatalogsDto = {
  parameters: [
    {
      tech_id: '0c44602f-a780-4092-8dfd-a670723df782',
      name: 'Температура подшипника',
      description: 'Температура опорного подшипника оборудования'
    },
    {
      tech_id: 'dc04d741-99e6-4258-b270-c24f20eceee4',
      name: 'Вибрация двигателя',
      description: 'Среднеквадратичное значение вибрации'
    },
    {
      tech_id: 'aca72554-bc0b-4853-9d0a-d43e2861ce11',
      name: 'Давление в системе',
      description: null
    }
  ],
  aggregation_levels: [
    { tech_id: '69060959-09a5-4257-9e0a-1491f44d1e3e', name: 'Сутки', description: null },
    { tech_id: '69060959-09a5-4257-9e0a-1491f44d1e3f', name: 'Месяц', description: null }
  ],
  aggregation_rules: [
    { tech_id: 'b73671d9-ce30-43e5-94f0-962e9fb764a1', name: 'Среднее', description: null },
    { tech_id: 'f6f1d7d1-f532-4308-9aa8-34c06616cca8', name: 'Сумма', description: null }
  ],
  plan_types: [
    { tech_id: 'f59001c1-5ee3-4a65-aa2b-baaccaee5d67', name: 'Факт', description: null },
    { tech_id: 'f59001c1-5ee3-4a65-aa2b-baaccaee5d68', name: 'План', description: null }
  ],
  functions: [
    {
      functions_tech_id: '509f20dc-8954-4f75-84d4-225b0a9dc5dc',
      name: '>',
      description: 'Значение больше порога'
    },
    {
      functions_tech_id: 'f5020752-ce51-44d8-b61c-6b98a46d9889',
      name: '<',
      description: 'Значение меньше порога'
    },
    { functions_tech_id: 'f5020752-ce51-44d8-b61c-6b98a46d9888', name: '=', description: null },
    {
      functions_tech_id: 'f5020752-ce51-44d8-b61c-6b98a46d9887',
      name: '≥',
      description: 'Больше или равно'
    },
    {
      functions_tech_id: 'f5020752-ce51-44d8-b61c-6b98a46d9886',
      name: '≤',
      description: 'Меньше или равно'
    }
  ],
  ui_attributes: [
    {
      ui_attributes_tech_id: 'e281db77-1b1d-4f5c-8409-bde851506b34',
      name: 'Background-color',
      description: null,
      attr_key: { key: 'Background-color' },
      interface_name: 'Цвет фона'
    },
    {
      ui_attributes_tech_id: 'e281db77-1b1d-4f5c-8409-bde851506b35',
      name: 'Color',
      description: 'Демонстрационное свойство',
      attr_key: { key: 'Color' },
      interface_name: 'Цвет текста'
    },
    {
      ui_attributes_tech_id: 'e281db77-1b1d-4f5c-8409-bde851506b36',
      name: 'Font-weight',
      description: 'Демонстрационное свойство',
      attr_key: { key: 'Font-weight' },
      interface_name: 'Начертание'
    }
  ],
  ui_rules: [
    {
      ui_rules_tech_id: '034eb292-548f-4a3c-b159-149c12ba36e2',
      rules_tech_id: 'c66208a7-52d0-4df9-9a44-7bd36a16493c',
      parameters_tech_id: '0c44602f-a780-4092-8dfd-a670723df782',
      journals_tech_id: journal,
      name: 'Критическая температура',
      description: '',
      attr_key: 'Background-color',
      interface_name: 'Цвет фона',
      value: 'red'
    }
  ],
  notify_rules: [
    {
      rule_notification_tech_id: '034eb292-548f-4a3c-b159-149c12ba36e3',
      rules_tech_id: 'c66208a7-52d0-4df9-9a44-7bd36a16493c',
      parameters_tech_id: '0c44602f-a780-4092-8dfd-a670723df782',
      journals_tech_id: journal,
      description: '',
      message_template: 'Температура выше нормы',
      channel_type: 'email',
      reciepient: ['operator@example.test']
    }
  ],
  scales: [],
  scale_values: []
}
export const parametersMock: ParameterDto[] = [
  {
    parameters_tech_id: '0c44602f-a780-4092-8dfd-a670723df782',
    name: 'Температура подшипника',
    description: 'Температура опорного подшипника оборудования',
    rules: [
      {
        rules_tech_id: 'c66208a7-52d0-4df9-9a44-7bd36a16493c',
        name: 'Критическое значение',
        description: 'Превышение порога',
        parameters_tech_id: '0c44602f-a780-4092-8dfd-a670723df782',
        journals_tech_id: journal,
        aggregation_levels_tech_id: '69060959-09a5-4257-9e0a-1491f44d1e3e',
        aggregation_rules_tech_id: 'b73671d9-ce30-43e5-94f0-962e9fb764a1',
        plan_types_tech_id: 'f59001c1-5ee3-4a65-aa2b-baaccaee5d67',
        is_default: false,
        functions_tech_id: '509f20dc-8954-4f75-84d4-225b0a9dc5dc',
        value: '90',
        created_by: 'dev_user',
        scales_tech_id: null,
        prev_rules_tech_id: null,
        version: 1
      },
      {
        rules_tech_id: 'c66208a7-52d0-4df9-9a44-7bd36a16493d',
        name: 'Обычное значение',
        description: '',
        parameters_tech_id: '0c44602f-a780-4092-8dfd-a670723df782',
        journals_tech_id: journal,
        aggregation_levels_tech_id: '69060959-09a5-4257-9e0a-1491f44d1e3e',
        aggregation_rules_tech_id: 'b73671d9-ce30-43e5-94f0-962e9fb764a1',
        plan_types_tech_id: 'f59001c1-5ee3-4a65-aa2b-baaccaee5d67',
        is_default: true,
        functions_tech_id: null,
        value: '0',
        created_by: 'dev_user',
        scales_tech_id: null,
        prev_rules_tech_id: null,
        version: 1
      }
    ]
  }
]
