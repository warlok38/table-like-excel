import type { BackgroundDataStatusItem, CellEditor, CellTable, CellValue } from '@/components/Table'

const statusBackground = (
  alias: string,
  value: string,
  techId: string
): BackgroundDataStatusItem => ({
  alias,
  value,
  tech_id: techId
})

const makeCell = (
  id: string,
  row: number,
  col: number,
  value: CellValue,
  options: {
    colspan?: number
    rowspan?: number
    color?: string | null
    field?: CellTable['data']['field']
    commentsId?: string | null
    editable?: boolean | null
    formattedValue?: CellValue
    editor?: CellEditor | null
    permissions?: CellTable['data']['permissions']
    dataStatus?: CellTable['data_status']
  } = {}
): CellTable => ({
  label: null,
  data: {
    id,
    col,
    row,
    colspan: options.colspan ?? 1,
    rowspan: options.rowspan ?? 1,
    color: options.color ?? null,
    field: options.field ?? null,
    comments_id: options.commentsId ?? null,
    parameter_id: null,
    catalogs_id: null,
    editable: options.editable ?? true,
    editor: options.editor,
    permissions: options.permissions
  },
  value,
  formatted_value: options.formattedValue === undefined ? value : options.formattedValue,
  data_status: options.dataStatus ?? null
})

export const tableDataMock: CellTable[][] = [
  [
    makeCell('e821b367-b73e-49e5-9c30-34891a54c3f7', 1, 1, 'Производственный отчет', {
      colspan: 10,
      color: '#dbeafe',
      editable: false
    })
  ],
  [
    makeCell('57c0b83b-bcf2-4453-9231-a60d56f62e7b', 2, 1, 'Показатель', {
      rowspan: 2,
      color: '#f3f4f6',
      editable: false
    }),
    makeCell('5f42b0e1-801d-4eec-9ca2-c5d97a70da2b', 2, 2, 'I квартал', {
      colspan: 3,
      color: '#f3f4f6',
      editable: false
    }),
    makeCell('2a8942f2-8224-48d1-915a-ce4c6dd7a2da', 2, 5, 'II квартал', {
      colspan: 3,
      color: '#f3f4f6',
      editable: false
    }),
    makeCell('21f98fbc-7fb7-496b-80f2-a208ef00fdd5', 2, 8, 'III квартал', {
      colspan: 3,
      color: '#f3f4f6',
      editable: false
    })
  ],
  [
    makeCell('8b0fbaea-5f4d-4866-9059-8f0b1760c7d6', 3, 2, 'Янв', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('13f9cc13-3765-4e16-b8ab-dd9b1e81a4eb', 3, 3, 'Фев', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('d20f8cfc-37e3-4f47-a2cd-a8f8f82a2a52', 3, 4, 'Мар', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('96d456c3-4325-4899-b992-69c5eba6e4d1', 3, 5, 'Апр', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('55169ff2-a4a9-4f45-bb82-3b0bd5d84163', 3, 6, 'Май', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('aa52d7dc-cb17-4980-8ea7-77dfdf907a92', 3, 7, 'Июн', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('6596bbd5-e2e6-4c73-8182-a9eed008c5e8', 3, 8, 'Июл', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('6384157e-7859-4e11-95df-0682b7287334', 3, 9, 'Авг', {
      color: '#f9fafb',
      editable: false
    }),
    makeCell('7b96f692-3954-4c49-a1a8-e0c8fd57b920', 3, 10, 'Сен', {
      color: '#f9fafb',
      editable: false
    })
  ],
  [
    makeCell('06ef62b2-cd74-436c-becb-fbdc3f59bdf4', 4, 1, 'Добыча, т', {
      color: '#ffffff',
      editable: false
    }),
    makeCell('990ca9c4-8e5e-4e7a-9468-9f86464af466', 4, 2, 1080, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('88dc09c2-f2ec-4c53-8bd4-7233f91dfd99', 4, 3, 1124, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('fc7f8c88-d751-4c15-bf55-9d52c51cc771', 4, 4, 1198, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('63741fdd-9b9f-442b-9241-b3eb93da2456', 4, 5, 1210, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('2b9f51b7-ea61-4ef2-a82b-2bd01acaa087', 4, 6, 1187, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e7f7ee'
    }),
    makeCell('845535ac-e9a3-4b4e-b319-442c6a0f7a13', 4, 7, 1245, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('552c8529-a0f7-4645-9ae2-8028a5998950', 4, 8, 1260, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('681c7ebe-10ac-4610-b752-c89ce3aa8681', 4, 9, 1304, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('199137f8-5d3b-4a0b-8b61-3effdbabf5e0', 4, 10, 1288, {
      field: 'number',
      editor: { type: 'number' }
    })
  ],
  [
    makeCell('4250619d-ae58-4c01-ad2a-8de1fb27f7b2', 5, 1, 'Переработка, т', {
      color: '#ffffff',
      editable: false
    }),
    makeCell('2be36b24-7b0b-4bd7-a4f4-33fefbf7cbba', 5, 2, 980, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('70757822-72cf-4c7f-91f5-fee8940ff767', 5, 3, 1004, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('e1dca14e-c589-45fa-b5e4-5b4a8be118cb', 5, 4, 1075, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('4f7a851b-3e72-49c9-9a66-3180ea66ac77', 5, 5, 1099, {
      field: 'number',
      editor: { type: 'number' },
      dataStatus: {
        data_statuses_tech_id: '9e4dfc15-207e-4078-b899-641dfd03c6b1',
        background: [
          statusBackground('Внимание', '#fff3bf', '62becd4d-934a-4799-af19-b03c7711cae4')
        ],
        note: {
          alias: 'Примечание',
          value: 'Проверить данные по апрелю перед отправкой сменному мастеру.'
        }
      }
    }),
    makeCell('b3136678-7983-46d6-bfbc-3b52a640c937', 5, 6, 1110, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('11435663-a662-46cc-91a8-78c964497d61', 5, 7, 1142, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('456766b5-af6b-4937-b4c9-486101c37153', 5, 8, 1168, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('a9b2b2b6-8d88-4d11-905a-a19e9fcfcf61', 5, 9, 1191, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('be4a0985-8018-4123-a5eb-452fbca95fb6', 5, 10, 1205, {
      field: 'number',
      editor: { type: 'number' }
    })
  ],
  [
    makeCell('1df559d6-b5d6-4562-b9e4-852ff21fbdfc', 6, 1, 'Извлечение, %', {
      color: '#ffffff',
      editable: false
    }),
    makeCell('ed1dc30f-a29e-44bd-88cb-e2406e634c60', 6, 2, 87.4, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('ff207841-35ff-4cd8-a6b2-91f091020ba8', 6, 3, 88.1, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('0d43c5f8-5759-48a0-96c2-8e3993ebfa09', 6, 4, 88.7, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('88f07ac6-58b4-4476-9ec3-940b4a1a006a', 6, 5, 89.2, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('ee291080-d9a7-4e28-9bee-65b5f92e0ce7', 6, 6, 89.5, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('dfd75fa7-cf78-4be2-a89a-95b695b9c780', 6, 7, 90.1, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('bc8d9ac8-4fdd-4dec-9dd0-5e38b409119b', 6, 8, 90.4, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('c5ba420e-cfcd-4407-9bfb-e44a7ec9e30d', 6, 9, 90.8, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('2d9cb8ff-d99d-43f3-97cf-11044f6559c0', 6, 10, 91.2, {
      field: 'number',
      editor: { type: 'number' }
    })
  ],
  [
    makeCell('27d9cb95-243c-492d-8314-d43e9cd544ea', 7, 1, 'План, т', {
      color: '#ffffff',
      editable: false
    }),
    makeCell('d5cfc100-841d-41e1-aa56-26b4ef53cc91', 7, 2, 1000, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('3864a1ec-8f34-4c48-87b2-7aed7f4f1a8f', 7, 3, 1050, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('78bc73c0-e3a1-49bb-8acd-75601d4b0586', 7, 4, 1100, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('53268fe2-9c06-4562-88a0-6a0a83183cbf', 7, 5, 1150, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('6faea2a5-d1ac-444f-8266-c5187ec70c3d', 7, 6, 1200, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('4001cbe5-908f-4105-b196-9e6a63baf873', 7, 7, 1200, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('082272e2-027a-4e1e-81d4-2b50ba087692', 7, 8, 1250, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('8788da55-11a6-4f8b-a192-5c342461881d', 7, 9, 1250, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    }),
    makeCell('5e61c8e5-c181-4af7-8605-471847b977f8', 7, 10, 1300, {
      field: 'number',
      editor: { type: 'number' },
      color: '#e8f3ff'
    })
  ],
  [
    makeCell('d0fd8748-a481-477f-b47d-b997f2e0f88a', 8, 1, 'Отклонение, т', {
      color: '#ffffff',
      editable: false
    }),
    makeCell('667d71d4-8c95-4c8d-9f3a-aebae4a30b0d', 8, 2, 80, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('1ab2f6d4-65fb-47b9-bf09-e67d0a51292a', 8, 3, 74, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('6e44571a-7539-4bd9-a0f5-012ce0cd9b19', 8, 4, 98, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('99e744ca-5b17-4b82-ba10-1d9206f9c9ca', 8, 5, 60, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('a9b13063-49d4-4969-9ae3-6546636602c6', 8, 6, -13, {
      field: 'number',
      editor: { type: 'number' },
      dataStatus: {
        data_statuses_tech_id: 'ec7e5510-ec9b-4673-99d5-20e3bc9b502f',
        background: [
          statusBackground('Отклонение', '#ffd6d6', '885398c1-d3fc-48ed-ba2d-34835ecaf86c')
        ],
        note: null
      }
    }),
    makeCell('e2af853d-99db-4c6a-8751-5c125a17f81a', 8, 7, 45, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('1654d9da-a453-4646-b65b-c8365e27049c', 8, 8, 10, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('fbe89b7f-af32-45db-8b76-f236a31b25d5', 8, 9, 54, {
      field: 'number',
      editor: { type: 'number' }
    }),
    makeCell('1134a3d7-e39c-49b4-aa18-17647ae78c80', 8, 10, -12, {
      field: 'number',
      editor: { type: 'number' },
      dataStatus: {
        data_statuses_tech_id: 'f38aa764-ecec-4628-a336-59b0046f6602',
        background: [
          statusBackground('Отклонение', '#ffd6d6', 'bd6fc39c-9aa4-4af8-8de7-807531ef0c0a'),
          statusBackground('Внимание', '#fff3bf', '4149c4a7-a520-48b1-a0fd-c88d669c9c4a')
        ],
        note: {
          alias: 'Примечание',
          value: 'Есть отрицательное отклонение, но значение подтверждено сменой.'
        }
      }
    })
  ],
  [
    makeCell('0337b72c-59bb-4aad-ba08-ae34ed18ad8c', 9, 1, 'Статус', {
      color: '#ffffff',
      editable: false
    }),
    makeCell('d945c8bf-9cc3-4876-b48c-df3f7c6d4881', 9, 2, 'Ок', {
      field: 'text',
      editor: { type: 'text' }
    }),
    makeCell('1eaa1d08-3a7e-4fb9-89a0-52684d9d4f45', 9, 3, 'Ок', {
      field: 'text',
      editor: { type: 'text' }
    }),
    makeCell('8f02eb63-bdc5-4b45-badc-2798a179333f', 9, 4, 'Ок', {
      field: 'text',
      editor: { type: 'text' }
    }),
    makeCell('d5ef189c-d599-4e44-a1c8-9c16eac1d110', 9, 5, 'Проверить', {
      field: 'text',
      editor: { type: 'text' },
      commentsId: '9a46db77-83e2-4ea1-8752-f63dd1a0dc24'
    }),
    makeCell('88ae0c69-edbd-4078-9a29-269d9fc16631', 9, 6, 'Ок', {
      field: 'text',
      editor: { type: 'text' }
    }),
    makeCell('8b5a4202-472d-4380-81b5-b88926a2896b', 9, 7, 'Ок', {
      field: 'text',
      editor: { type: 'text' }
    }),
    makeCell('8d88f088-931a-4613-8334-70c86bf83d80', 9, 8, 'Ок', {
      field: 'text',
      editor: { type: 'text' }
    }),
    makeCell('67a722d2-28a9-464a-b8d3-78bc8afe80a2', 9, 9, 'Проверить', {
      field: 'text',
      editor: { type: 'text' },
      dataStatus: {
        data_statuses_tech_id: '2f907433-44d9-4b3d-99b7-616cb4e21024',
        background: [
          statusBackground('Внимание', '#fff3bf', '15a4e526-37b7-4f03-a74c-9695a640c5db')
        ],
        note: {
          alias: 'Примечание',
          value: 'Статус ожидает подтверждения от лаборатории.'
        }
      }
    }),
    makeCell('3f15a218-976b-4bc6-bd9d-d59f9e35db97', 9, 10, 'Ок', {
      field: 'text',
      editor: { type: 'text' }
    })
  ],
  [
    makeCell('0df3d9cd-ad35-42f6-aee5-9bc6d86b86a3', 10, 1, 'Комментарий', {
      color: '#ffffff',
      editable: false
    }),
    makeCell('9397d0bb-9395-4dbf-917d-b558e062fe85', 10, 2, 'Смена А', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('0fe98c7d-09b8-496c-8050-8a85721c4102', 10, 3, 'Смена Б', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('6992277a-3ab3-4ba3-986e-79ff72f405cc', 10, 4, 'Смена А', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('37d1fe57-4594-4822-8c31-716f715dcd59', 10, 5, 'Смена В', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('e2dd895e-455e-44f9-80e0-9b7ec3f66b6c', 10, 6, 'Смена Б', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('e90f4566-f1f0-49af-9088-d7a82f8a4bec', 10, 7, 'Смена А', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('8b7278ed-4435-46cc-ae26-e4d6dcad43c2', 10, 8, 'Смена В', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('bf0f2197-d15c-4c18-8c06-9fad62c2d67a', 10, 9, 'Смена Б', {
      field: 'comment',
      editor: { type: 'textarea' }
    }),
    makeCell('52f00bb8-758d-4845-bf74-5ee8c9e99992', 10, 10, 'Смена А', {
      field: 'comment',
      editor: { type: 'textarea' }
    })
  ]
]
