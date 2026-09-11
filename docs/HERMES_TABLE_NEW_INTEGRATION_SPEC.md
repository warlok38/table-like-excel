# Интеграция `TableNew` с существующей страницей и backend-контрактами

> Инструкция для Hermes Agent v0.14.0 (`coder36`). Выполняй работу автономно в целевом проекте. Сначала исследуй существующий поток данных и сохранения, затем добавляй интеграцию небольшими проверяемыми шагами. Не удаляй и не заменяй старую таблицу на этом этапе.

## Результат

На странице, где сейчас отображается старая таблица `<Table ... />`, рядом с ней должна отображаться новая таблица `<TableNew ... />`. Обе таблицы получают один и тот же подтверждённый backend-снимок, но используют собственные UI-контракты. Существующие API, store/actions, права доступа и бизнес-правила остаются источником истины.

Новая таблица должна уметь:

- отобразить реальные строки, объединённые ячейки, значения, базовые фоны, `DataStatus` и примечания;
- получить существующий список доступных цветов заливки;
- редактировать только разрешённые значения;
- отправлять изменения значений, фонов и примечаний через уже существующие команды/API;
- после успешного сохранения принять подтверждённый снимок данных;
- при ошибке оставить несохранённые изменения внутри `TableNew` для повторной попытки.

Старая `<Table>` должна продолжать работать без изменения поведения. Её удаление, переключатель между таблицами и миграция остальных страниц не входят в эту задачу.

## Обязательные ограничения

1. Не переносить внутрь `TableNew` зависимости старой таблицы: Redux/store, API-клиенты, generated API, selectors, journal/vector/chart entities, роутинг и page-specific helpers.
2. Не менять внутренний публичный контракт `TableNew`, пока интеграционный адаптер способен решить несовпадение контрактов.
3. Не мутировать backend-ответы и объекты, которыми пользуется старая таблица. Любое преобразование создаёт новые объекты.
4. Не генерировать `id`, `techId`, `tech_id` или UUID во время выполнения. Существующие идентификаторы копируются как есть.
5. Не подставлять случайные идентификаторы для ячеек без `id`. У `TableNew` уже есть детерминированный fallback-ключ.
6. Не дублировать backend-запросы только ради второй таблицы, если страница уже имеет загруженные данные. Адаптировать существующий снимок.
7. Не добавлять Redux или новую библиотеку управления состоянием ради интеграции.
8. Не писать автотесты и не добавлять тестовые зависимости. Проверять type/lint/build-командами проекта и вручную в браузере.
9. Не рефакторить несвязанные части старой страницы.
10. Не маскировать ошибки через `any`, `@ts-ignore`, `@ts-expect-error` или небезопасные двойные type assertions. Несовпадения контрактов разрешать явным адаптером.

## Публичный контракт `TableNew`

Сохрани уже добавленный в целевом проекте import новой таблицы и используй локальное имя `TableNew`. Если её public export называется `Table`, задай alias в существующем import statement. Не заменяй установленный путь путём из этого standalone-репозитория.

```tsx
import {
  Table as TableNew,
  type AvailableBackgroundColor,
  type CellEditor,
  type CellTable,
  type CellValue,
  type TableSaveChangeset
} from '@/components/TableNew'
```

`@/components/TableNew` выше показывает форму public import. Перед изменением кода замени пример фактическим уже существующим путём целевого проекта и дальше используй только этот путь.

Не импортируй внутренние файлы `model/`, `ui/` или `lib/` напрямую. Найди фактический public entry point новой таблицы и импортируй только из него.

```ts
type TableNewProps = {
  data: CellTable[][]
  availableBackgroundColors?: AvailableBackgroundColor[]
  cellManagementEnabled: boolean
  onSaveChanges: (changeset: TableSaveChangeset) => Promise<CellTable[][]>
}

type CellValue = string | number | null

type CellEditor =
  | { type: 'text'; maxLength?: number }
  | { type: 'textarea'; maxLength?: number }
  | { type: 'number'; min?: number; max?: number; step?: number }
  | { type: 'select'; options: Array<{ value: string; label: string }> }
  | { type: 'date'; min?: string; max?: string; displayFormat?: 'DD.MM.YYYY' }
  | { type: 'readonly' }

type CellTable = {
  label: string | null
  data: {
    id?: string | null
    col: number
    row: number
    colspan: number
    rowspan: number
    color?: string | null
    field?: 'text' | 'number' | 'comment' | 'vector' | null
    comments_id?: string | null
    parameter_id?: string | null
    catalogs_id?: string | null
    interval?: string | null
    time_format?: string | null
    timestamp?: string | null
    change_mode?: string | null
    editable?: boolean | null
    editor?: CellEditor | null
    permissions?: {
      value?: boolean
      background?: boolean
      note?: boolean
    } | null
    changed?: boolean
    filters?: Record<string, string | number | boolean | null | undefined> | null
    tdata_id?: string | null
    shift_approved?: boolean
    production_date?: string | null
    event_datetime?: string | null
    repeat_rec?: boolean
    production_period?: unknown[] | null
    properties_journal_tech_id?: string | null
  }
  value: CellValue
  formatted_value: number | string | null
  chart_data?: unknown | null
  chart_svg?: string | null
  data_status: {
    data_statuses_tech_id?: string
    background?: Array<{
      alias: string | null
      value: string | null
      tech_id: string | null
    }> | null
    note?: { alias: string; value: string } | null
  } | null
}

type AvailableBackgroundColor = {
  alias: string
  value: string | null
  tech_id: string
}

type TableSaveChangeset = {
  values: Array<{
    target: { cellKey: string; row: number; col: number }
    value: CellValue
  }>
  backgrounds: Array<{
    target: { cellKey: string; row: number; col: number }
    background: string | null
  }>
  notes: Array<{
    target: { cellKey: string; row: number; col: number }
    note: string | null
  }>
}
```

Семантика публичного контракта:

- `onSaveChanges` получает только изменённые операции, а не полную таблицу.
- `onSaveChanges` обязан вернуть полный подтверждённый `CellTable[][]`. Этот результат становится новой локальной базой `TableNew`.
- rejected Promise означает ошибку сохранения. `TableNew` сохраняет pending changes и позволяет повторить попытку.
- `background: null` означает «без заливки».
- `note: null` означает удаление примечания.
- `value: null` означает очищенное значение.
- ключ ячейки равен `cell.data.id`, если он есть; иначе используется детерминированная комбинация позиции массива и `data.row/data.col`. Порядок данных нельзя менять между началом редактирования и сохранением.
- `editable === false` запрещает изменение значения, заливки и примечания.
- отсутствие `editor` или `editor.type === 'readonly'` запрещает только редактирование значения. Заливка и примечания всё ещё могут быть доступны.
- `permissions.value/background/note === false` точечно запрещает соответствующее действие.
- действия с `DataStatus` включаются через `cellManagementEnabled`; редактирование значений управляется `editor`, `editable` и `permissions.value` отдельно.

## Архитектура интеграции

Интеграция принадлежит странице или существующему page/feature slice, который уже владеет загрузкой старой таблицы. Не помещай backend-знания в общий UI-компонент.

Раздели ответственность на три небольших элемента, используя принятую в целевом проекте структуру и именование:

1. **Mapper входных данных** — чистая функция `legacy/backend snapshot -> CellTable[][]`.
2. **Save adapter** — `TableSaveChangeset -> существующие команды/API -> подтверждённый snapshot -> CellTable[][]`.
3. **Page integration** — рендерит старую и новую таблицы рядом и связывает их с уже существующим состоянием страницы.

Если проект использует FSD, оставь одноразовую интеграцию внутри slice страницы, например в её `model/`/`lib/` и `ui/`. Не создавай новую entity или feature только для единственной страницы. Импорт `TableNew` должен идти через public API её slice/компонента.

Зависимости должны смотреть в одну сторону:

```text
страница с реальными API/store/contracts
  ├── старая Table (без изменений)
  └── page-local integration adapter
        └── TableNew public API
```

`TableNew` не должна импортировать страницу, старую `Table`, backend API или store.

## Этап 1. Разведка целевого проекта

- [ ] Найди реальную страницу и оба импорта:

  ```powershell
  rg -n "<Table\b|TableNew|from .*Table" src app pages
  ```

  Если каталогов из команды нет, сначала выполни `rg --files` и повтори поиск по существующим source-каталогам.

- [ ] Проследи происхождение каждого prop старой `<Table>` до источника: query/hook/selector/loader, тип backend-ответа, loading/error state и refetch/invalidation после сохранения.
- [ ] Найди все текущие пути изменения ячейки: значение, фон, добавление/изменение/удаление примечания. Зафиксируй функции, request DTO, обязательные идентификаторы и формат успешного ответа.
- [ ] Найди источник палитры цветов. Не копируй значения из mock-файла новой таблицы.
- [ ] Найди правила редактируемости старой таблицы: page flags, роли, `editable`, тип/поле ячейки, наличие `comments_id`, режим страницы и иные guards.
- [ ] Проверь, является ли импортированный `TableNew` точной версией контракта из этой инструкции. Если типы отличаются, ориентируйся на установленный public export и зафиксируй отличие до редактирования.
- [ ] Запиши найденное соответствие в рабочем описании изменения или комментарии к итоговому PR:

  ```text
  source table data -> ...
  source raw cell type -> ...
  source palette -> ...
  save value command -> ...
  save background command -> ...
  save note command -> ...
  confirmed snapshot/refetch -> ...
  page-level edit guards -> ...
  ```

Не начинай mapper, пока не найден реальный источник raw value и реальные save-команды. `formatted_value` нельзя автоматически считать backend-значением для редактируемой ячейки.

## Этап 2. Mapper входных данных

- [ ] Создай page-local чистую функцию с явно типизированным входом из целевого проекта и выходом `CellTable[][]`.
- [ ] Преобразуй каждую строку и ячейку через `map`; не изменяй исходный объект.
- [ ] Сохрани реальные `data.id`, `row`, `col`, `colspan`, `rowspan` и backend-идентификаторы без генерации замен.
- [ ] Если `colspan`/`rowspan` отсутствуют, подставляй `1`. Координаты `row`/`col` бери из контракта старой таблицы; array index используй только если старый контракт действительно не содержит координат.
- [ ] `value` заполняй сырым значением, которое ожидает существующий save API. `formatted_value` оставляй отображаемым значением.
- [ ] Нормализуй пустые значения к `null`, когда это соответствует реальному backend-контракту. Не превращай число `0` или boolean-подобную строку в `null` через truthy-проверки.
- [ ] Скопируй `DataStatus.background` и `DataStatus.note` в ожидаемую snake_case/camelCase форму новой таблицы.
- [ ] Сохрани все статические идентификаторы, необходимые save adapter: `id`, `comments_id`, `parameter_id`, `catalogs_id`, `tdata_id`, `properties_journal_tech_id`, `data_statuses_tech_id` и другие реально используемые поля.
- [ ] Не добавляй editor по догадке. Построй явную функцию определения `CellEditor | null` из существующих метаданных и режимов страницы.
- [ ] Построй явную функцию определения `permissions`. Сначала примени общий запрет страницы/ячейки, затем точечные разрешения действий.

Рекомендуемый каркас, который нужно адаптировать к фактическим типам целевого проекта:

```ts
import type { CellEditor, CellTable } from '@/components/TableNew'

type SourceTableResponse = SourceTableCell[][]

type MapLegacyTableOptions = {
  canManageDataStatus: boolean
  canEditValues: boolean
}

export function mapLegacyTableToTableNew(
  rows: SourceTableResponse,
  options: MapLegacyTableOptions
): CellTable[][] {
  return rows.map((row, rowIndex) =>
    row.map((sourceCell, cellIndex) => {
      const editor = mapExistingEditor(sourceCell, options)
      const editable = mapExistingEditable(sourceCell, options)

      return {
        label: sourceCell.label ?? null,
        data: {
          id: sourceCell.data.id ?? null,
          row: sourceCell.data.row ?? rowIndex,
          col: sourceCell.data.col ?? cellIndex,
          colspan: sourceCell.data.colspan ?? 1,
          rowspan: sourceCell.data.rowspan ?? 1,
          color: sourceCell.data.color ?? null,
          field: mapExistingField(sourceCell.data.field),
          comments_id: sourceCell.data.comments_id ?? null,
          parameter_id: sourceCell.data.parameter_id ?? null,
          catalogs_id: sourceCell.data.catalogs_id ?? null,
          tdata_id: sourceCell.data.tdata_id ?? null,
          properties_journal_tech_id: sourceCell.data.properties_journal_tech_id ?? null,
          editable,
          editor,
          permissions: {
            value: editable && editor !== null && editor.type !== 'readonly',
            background: editable && options.canManageDataStatus,
            note: editable && options.canManageDataStatus
          }
        },
        value: getExistingRawValue(sourceCell),
        formatted_value: sourceCell.formatted_value ?? null,
        chart_data: sourceCell.chart_data ?? null,
        chart_svg: sourceCell.chart_svg ?? null,
        data_status: mapExistingDataStatus(sourceCell.data_status)
      }
    })
  )
}
```

Этот код — форма границы, а не готовое копирование. `SourceTableCell`, путь импорта и обращения к полям должны быть заменены найденными на этапе разведки типами и public import. Не оставляй демонстрационные имена в итоговом коде.

### Правила editor mapping

Используй существующие metadata/guards. Допустимые выходы:

| Реальная семантика              | `CellEditor`                                              |
| ------------------------------- | --------------------------------------------------------- |
| короткий текст                  | `{ type: 'text', maxLength }`                             |
| многострочный комментарий/текст | `{ type: 'textarea', maxLength }`                         |
| число                           | `{ type: 'number', min, max, step }`                      |
| справочник/enum                 | `{ type: 'select', options: [{ value, label }] }`         |
| календарная дата без времени    | `{ type: 'date', min, max, displayFormat: 'DD.MM.YYYY' }` |
| отображение без редактирования  | `{ type: 'readonly' }` или `null`                         |

Не отображай datetime/timestamp как date-editor, если существующий API ожидает время или timezone. До появления корректного editor оставь такую ячейку readonly.

Для select `option.value` должен совпадать с сырым значением save-контракта. Для date значение должно быть ISO `YYYY-MM-DD`. Для number `value` должен быть числом или `null`, а не локализованной строкой с запятой.

## Этап 3. Палитра и `cellManagementEnabled`

- [ ] Адаптируй существующий ответ палитры к `AvailableBackgroundColor[]`.
- [ ] Сохраняй `alias`, `value` и `tech_id` из backend. `value: null` представляет снятие заливки.
- [ ] Если backend не возвращает вариант «Без заливки», добавляй его только если существующий продукт разрешает очистку фона. Не придумывай для него UUID: используй существующий статический идентификатор/константу проекта либо согласованный sentinel вне backend payload.
- [ ] Не показывай mock-палитру в production integration.
- [ ] Вычисли флаг управления на уровне страницы. Базовое совместимое правило:

  ```ts
  const cellManagementEnabled = mappedData.some((row) =>
    row.some((cell) => cell.data_status !== null && cell.data_status !== undefined)
  )
  ```

  Если старая страница имеет более строгий permission/режим, объедини его с этим условием через `&&`. Не ослабляй существующие права.

## Этап 4. Save adapter

Save adapter должен находиться рядом с интеграцией страницы. Он может использовать существующие hooks/actions/API этой страницы, но не должен попадать внутрь `TableNew`.

- [ ] Создай lookup текущего подтверждённого source snapshot по стабильному `cellKey`. Для ячейки с `data.id` ключ равен этому `id`; для ячейки без `id` используй тот же public helper новой таблицы, если он экспортируется.
- [ ] Для каждого `change.target.cellKey` найди исходную ячейку и извлеки реальные backend-идентификаторы. Не полагайся только на визуальные `row`/`col`, если API требует `id`, `parameter_id`, `comments_id`, `tdata_id` или status tech id.
- [ ] Явно преобразуй три массива операций в существующие request DTO.
- [ ] Переиспользуй существующие mutation/action функции. Не создавай параллельный API-клиент.
- [ ] Дождись завершения всех операций. Не возвращай успех до подтверждения backend.
- [ ] После успеха получи канонический снимок тем же способом, что старая таблица: mutation response, refetch query или selector после fulfilled action.
- [ ] Прогони подтверждённый source snapshot через тот же входной mapper и верни полный `CellTable[][]`.
- [ ] При любой ошибке брось `Error` наружу. Не возвращай старый снимок как будто сохранение успешно.
- [ ] Если существующий backend поддерживает только сохранение полной таблицы, примени changeset к свежему source snapshot в adapter, собери существующий full-save DTO, сохрани, затем всё равно refetch/нормализуй подтверждённый ответ.
- [ ] Если backend поддерживает атомарный batch, отправь один batch. Если доступны только отдельные запросы, сохрани операции в безопасном для домена порядке и документируй риск частичного успеха. Не используй `Promise.all`, если запросы могут конфликтовать по одной ячейке или требуют порядка.

Каркас обработчика:

```ts
const handleTableNewSave = useCallback(
  async (changeset: TableSaveChangeset): Promise<CellTable[][]> => {
    const sourceSnapshot = getCurrentConfirmedTableSnapshot()
    const sourceByCellKey = buildSourceCellLookup(sourceSnapshot)

    const valueCommands = changeset.values.map((change) =>
      mapValueChangeToExistingCommand(change, sourceByCellKey)
    )
    const backgroundCommands = changeset.backgrounds.map((change) =>
      mapBackgroundChangeToExistingCommand(change, sourceByCellKey)
    )
    const noteCommands = changeset.notes.map((change) =>
      mapNoteChangeToExistingCommand(change, sourceByCellKey)
    )

    await saveWithExistingContracts({
      valueCommands,
      backgroundCommands,
      noteCommands
    })

    const confirmedSourceSnapshot = await getConfirmedTableSnapshot()
    return mapLegacyTableToTableNew(confirmedSourceSnapshot, mapperOptions)
  },
  [
    getConfirmedTableSnapshot,
    getCurrentConfirmedTableSnapshot,
    mapperOptions,
    saveWithExistingContracts
  ]
)
```

Состав dependency array выше показывает обязательные категории зависимостей. В итоговом коде используй фактические стабильные функции/значения целевого проекта; memoize объект options либо перечисли его примитивные поля, чтобы обработчик не пересоздавался на каждом render.

### Идентификаторы save target

Новая таблица намеренно отдаёт только:

```ts
{
  ;(cellKey, row, col)
}
```

Save adapter обогащает target из исходного snapshot. Ожидаемая форма внутреннего lookup может выглядеть так:

```ts
type ExistingBackendIdentifiers = {
  id: string | null
  commentsId: string | null
  parameterId: string | null
  catalogsId: string | null
  dataStatusTechId: string | null
  tdataId: string | null
  propertiesJournalTechId: string | null
}
```

Добавляй только те поля, которые действительно требуют существующие команды. Не расширяй публичный `TableSaveChangeset` backend-деталями.

### Особые случаи сохранения

- Снятие фона: `background === null` должно преобразовываться в существующую команду очистки, а не пропускаться.
- Удаление примечания: `note === null` должно вызывать существующую delete/clear семантику.
- Пустой текст редактора уже нормализуется новой таблицей к `null`; mapper команды должен сохранить эту семантику.
- Если `data_statuses_tech_id` появляется только после первого сохранения, используй идентификатор из подтверждённого ответа, не генерируй его.
- Если backend возвращает частичный объект, выполни существующий refetch вместо конструирования «подтверждённого» снимка по догадке.
- Если права или dataset изменились во время редактирования, save adapter обязан использовать актуальный подтверждённый source snapshot и отклонить неизвестный `cellKey` понятной ошибкой.

## Этап 5. Параллельный рендер на странице

- [ ] Не переименовывай старую таблицу, если это создаёт большой diff. Новую импортируй с alias `TableNew`.
- [ ] Построй `mappedTableNewData` через `useMemo`, если исходный snapshot и options имеют стабильные ссылки. Не добавляй memoization поверх нестабильных зависимостей ради формальности.
- [ ] Передай новой таблице реальные данные, реальную палитру, вычисленный permission flag и save adapter.
- [ ] Оберни старую и новую таблицы в два явно подписанных блока для ручного сравнения.
- [ ] Сохрани существующие loading/error/empty guards страницы. Не монтируй `TableNew` до появления валидного массива данных.
- [ ] Если route может переключить независимый dataset без размонтирования страницы, передай `key`, построенный из уже существующего стабильного dataset/report id. Не генерируй ключ на каждом render.

Ожидаемая композиция:

```tsx
<section aria-labelledby="legacy-table-title">
  <h2 id="legacy-table-title">Текущая таблица</h2>
  <Table {...existingTableProps} />
</section>

<section aria-labelledby="new-table-title">
  <h2 id="new-table-title">Новая таблица</h2>
  <TableNew
    key={existingDatasetId}
    data={mappedTableNewData}
    availableBackgroundColors={mappedBackgroundColors}
    cellManagementEnabled={cellManagementEnabled}
    onSaveChanges={handleTableNewSave}
  />
</section>
```

Если `existingDatasetId` на странице отсутствует и dataset не переключается без remount, `key` не нужен. Не придумывай его.

По умолчанию блоки идут вертикально один за другим: широкие таблицы рядом по горизонтали ухудшат сравнение и создадут двойной горизонтальный scroll. Если под словом «рядом» в существующей странице уже подразумевается конкретный layout, следуй её стилям, но не меняй размеры самих таблиц.

## Этап 6. Стили и совместимость

- [ ] Проверь глобальные selectors старой таблицы (`table`, `td`, `tr`, `input`, `textarea`) на влияние на `TableNew`.
- [ ] По возможности сузь старые глобальные стили существующим контейнером страницы. Не редактируй CSS Modules новой таблицы для компенсации случайного global leakage, если источник проблемы находится на странице.
- [ ] Проверь sticky header, overflow containers, stacking contexts и portal UI редактора/примечания.
- [ ] Не скрывай старую таблицу и не ставь feature flag без прямого требования.
- [ ] Не меняй русские подписи и семантику существующих действий без необходимости интеграции.

## Проверка

Сначала прочитай scripts в `package.json` целевого проекта и используй существующие команды. Не добавляй новые scripts.

- [ ] Запусти TypeScript/typecheck, если он есть.
- [ ] Запусти существующий lint, если он есть.
- [ ] Запусти production build.
- [ ] Исправь все новые ошибки. Отдельно зафиксируй только доказанно предсуществующие ошибки, приложив команду и точный вывод.
- [ ] Запусти приложение и открой реальный route старой таблицы.

Ручная матрица:

| Сценарий                        | Ожидаемый результат                                        |
| ------------------------------- | ---------------------------------------------------------- |
| Первичная загрузка              | Старая и новая таблицы показывают один dataset             |
| `colspan`/`rowspan`             | Объединённые ячейки совпадают структурно                   |
| Форматированные значения        | Текст/числа визуально соответствуют старой таблице         |
| `DataStatus.background`         | Статусные фоны и градиенты отображаются                    |
| Примечание                      | Маркер и preview показывают существующий текст             |
| Одиночный click                 | Выбрана одна ячейка новой таблицы                          |
| Drag selection                  | Выделяется прямоугольный диапазон                          |
| Ctrl/Cmd + click                | Добавляется/удаляется независимая ячейка                   |
| Readonly                        | Ячейка выбирается, но запрещённые действия недоступны      |
| Редактирование значения         | Двойной click/клавиатура открывают правильный editor       |
| Select/date                     | В save уходит raw value, не label/локализованная дата      |
| Заливка                         | Изменяются только разрешённые выбранные ячейки             |
| Без заливки                     | В backend-команду уходит clear/null-семантика              |
| Добавление/изменение note       | После save отображается подтверждённый текст               |
| Удаление note                   | Выполняется существующая delete/clear команда              |
| Cancel                          | Pending changes откатываются без backend-вызова            |
| Save success                    | Возвращённый snapshot становится новой базой               |
| Save failure                    | Ошибка видна, pending changes доступны для retry           |
| Повторный Save во время запроса | Дублирующий запрос не создаётся                            |
| Смена dataset                   | Новая таблица не показывает pending state прошлого dataset |
| Старая таблица                  | Поведение до интеграции не изменилось                      |

Для network-проверок используй browser DevTools/CDP: сверяй endpoint, количество запросов, payload identifiers, `null`-операции и refetch. Не ограничивайся визуальным подтверждением.

## Критерии готовности

Работа завершена только если одновременно выполняются все условия:

1. На реальной странице одновременно видны старая `<Table>` и новая `<TableNew>`.
2. Обе таблицы используют один исходный backend-снимок; mock-данных на production route нет.
3. Адаптация данных и сохранения находится снаружи `TableNew`.
4. `TableNew` не получила зависимостей старого проекта и не импортирует higher-level modules.
5. Реальные идентификаторы сохраняются без runtime-генерации.
6. Значения, фоны и примечания сохраняются существующими API/actions.
7. Успешное сохранение возвращает полный подтверждённый `CellTable[][]`; ошибка отклоняет Promise.
8. Права старой страницы не ослаблены.
9. Build и доступные type/lint checks проходят либо отдельно доказаны предсуществующие сбои.
10. Вся ручная матрица пройдена на реальном route, включая payload inspection.

## Что сообщить по завершении

В финальном отчёте Hermes должен указать:

- точный route и файл страницы;
- созданные/изменённые файлы и ответственность каждого;
- краткую таблицу mapping старого контракта в `TableNew`;
- какие существующие commands/API используются для value/background/note;
- откуда берётся подтверждённый snapshot после save;
- выполненные build/type/lint команды и их результат;
- результаты ручной проверки и network payload inspection;
- оставшиеся ограничения или неподдержанные типы ячеек без сокрытия их через `any`.
