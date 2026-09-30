import type {
  ParameterCatalogItem,
  ParameterConfiguration,
  RuleCatalogs
} from '../../model/parameter-rules'

export const parameterCatalogMock: readonly ParameterCatalogItem[] = [
  {
    id: 101,
    name: 'Температура подшипника',
    description: 'Температура опорного подшипника оборудования'
  },
  {
    id: 102,
    name: 'Вибрация двигателя',
    description: 'Среднеквадратичное значение вибрации электродвигателя'
  },
  { id: 103, name: 'Давление в системе', description: 'Давление в гидравлической системе' },
  { id: 104, name: 'Уровень масла', description: 'Уровень масла в картере оборудования' },
  { id: 105, name: 'Ток электродвигателя', description: 'Ток потребления электродвигателя' },
  { id: 106, name: 'Скорость вращения', description: 'Текущая скорость вращения вала' },
  { id: 107, name: 'Напряжение питания', description: 'Напряжение питающей сети' },
  {
    id: 108,
    name: 'Расход охлаждающей жидкости',
    description: 'Расход жидкости в контуре охлаждения'
  }
]

export const parameterConfigurationsMock: readonly ParameterConfiguration[] = [
  {
    parameterId: 101,
    updatedAt: '2026-09-21T07:32:00.000Z',
    rules: [
      {
        id: 1004,
        name: 'Значение за месяц',
        aggregationLevelId: 'month',
        aggregationRuleId: 'average',
        planTypeId: 'actual',
        isDefault: true,
        defaultValue: 100
      },
      {
        id: 1003,
        aggregationLevelId: 'day',
        aggregationRuleId: 'average',
        planTypeId: 'actual',
        name: 'Критическое значение',
        description: 'Подсветить значение при превышении допустимого порога',
        isDefault: false,
        condition: { operator: '>=', value: 90 },
        style: { textColor: '#D92D20', fontWeight: 'bold' }
      },
      {
        id: 1002,
        aggregationLevelId: 'day',
        aggregationRuleId: 'average',
        planTypeId: 'actual',
        name: 'Предупреждение',
        description: 'Показать приближение к критическому значению',
        isDefault: false,
        condition: { operator: '>=', value: 80 },
        style: { textColor: '#B54708', backgroundColor: '#FFFAEB', fontWeight: 'medium' },
        notificationText: 'Температура приближается к критическому значению'
      },
      {
        id: 1001,
        aggregationLevelId: 'day',
        aggregationRuleId: 'average',
        planTypeId: 'actual',
        name: 'Обычное значение',
        description: 'Значение показателя по умолчанию',
        isDefault: true,
        defaultValue: 0
      }
    ]
  },
  {
    parameterId: 102,
    updatedAt: '2026-09-20T03:15:00.000Z',
    rules: [
      {
        id: 2002,
        aggregationLevelId: 'day',
        aggregationRuleId: 'average',
        planTypeId: 'actual',
        name: 'Высокая вибрация',
        isDefault: false,
        condition: { operator: '>', value: 7.1 },
        style: { textColor: '#D92D20', fontWeight: 'bold' }
      },
      {
        id: 2001,
        aggregationLevelId: 'day',
        aggregationRuleId: 'average',
        planTypeId: 'actual',
        name: 'Нормальная вибрация',
        isDefault: true,
        defaultValue: 0
      }
    ]
  },
  {
    parameterId: 103,
    updatedAt: '2026-09-18T09:20:00.000Z',
    rules: [
      {
        id: 3001,
        aggregationLevelId: 'month',
        aggregationRuleId: 'average',
        planTypeId: 'actual',
        name: 'Низкое давление',
        description: 'Обратить внимание оператора на падение давления',
        isDefault: false,
        condition: { operator: '<=', value: 45 },
        style: { backgroundColor: '#FEF3F2', textColor: '#B42318', fontWeight: 'medium' }
      }
    ]
  }
]

export const ruleCatalogsMock: RuleCatalogs = {
  aggregationLevels: [
    { id: 'day', name: 'Сутки' },
    { id: 'month', name: 'Месяц' }
  ],
  aggregationRules: [
    { id: 'average', name: 'Среднее' },
    { id: 'sum', name: 'Сумма' }
  ],
  planTypes: [
    { id: 'actual', name: 'Факт' },
    { id: 'plan', name: 'План' }
  ],
  textColors: [],
  backgroundColors: []
}
