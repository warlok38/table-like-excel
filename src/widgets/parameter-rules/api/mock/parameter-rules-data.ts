import type { ParameterCatalogItem, ParameterConfiguration } from '../../model/parameter-rules'

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
        id: 1003,
        name: 'Критическое значение',
        description: 'Подсветить значение при превышении допустимого порога',
        isDefault: false,
        condition: { operator: '>=', value: 90 },
        style: { textColor: '#D92D20', fontWeight: 'bold' }
      },
      {
        id: 1002,
        name: 'Предупреждение',
        description: 'Показать приближение к критическому значению',
        isDefault: false,
        condition: { operator: '>=', value: 80 },
        style: { textColor: '#B54708', backgroundColor: '#FFFAEB', fontWeight: 'medium' },
        notificationText: 'Температура приближается к критическому значению'
      },
      {
        id: 1001,
        name: 'Обычное значение',
        description: 'Базовое оформление показателя',
        isDefault: true,
        style: { textColor: '#067647' }
      }
    ]
  },
  {
    parameterId: 102,
    updatedAt: '2026-09-20T03:15:00.000Z',
    rules: [
      {
        id: 2002,
        name: 'Высокая вибрация',
        isDefault: false,
        condition: { operator: '>', value: 7.1 },
        style: { textColor: '#D92D20', fontWeight: 'bold' }
      },
      {
        id: 2001,
        name: 'Нормальная вибрация',
        isDefault: true,
        style: { textColor: '#067647' }
      }
    ]
  },
  {
    parameterId: 103,
    updatedAt: '2026-09-18T09:20:00.000Z',
    rules: [
      {
        id: 3001,
        name: 'Низкое давление',
        description: 'Обратить внимание оператора на падение давления',
        isDefault: false,
        condition: { operator: '<=', value: 45 },
        style: { backgroundColor: '#FEF3F2', textColor: '#B42318', fontWeight: 'medium' }
      }
    ]
  }
]
