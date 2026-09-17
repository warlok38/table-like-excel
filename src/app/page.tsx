import { TableDemoClient } from './table-demo-client'
import {
  availableBackgroundColorsMock,
  mappedBackendTableDataMock,
  editorModelDataMock,
  noDataStatusTableMock,
  tableDataMock,
  virtualizedTableDataMock
} from '@/mocks/table'

export default function Home() {
  return (
    <main>
      <h1>Table Like Excel</h1>
      <TableDemoClient
        data={tableDataMock}
        availableBackgroundColors={availableBackgroundColorsMock}
      />
      <TableDemoClient
        title="Модель редакторов и права ячеек"
        description="Проверка выделения, заливки, примечаний, локального ввода, несохранённых изменений, сохранения и отмены."
        data={editorModelDataMock}
        availableBackgroundColors={availableBackgroundColorsMock}
      />
      <TableDemoClient
        title="Backend-контракт без editor"
        description="Backend-ячейки преобразуются в UI-модель один раз; editable включает только текстовый редактор."
        data={mappedBackendTableDataMock}
        availableBackgroundColors={availableBackgroundColorsMock}
      />
      <TableDemoClient
        title="Таблица без DataStatus"
        description="Проверка режима, где DataStatus не пришёл ни для одной ячейки."
        data={noDataStatusTableMock}
        availableBackgroundColors={availableBackgroundColorsMock}
      />
      <TableDemoClient
        title="Большая таблица с вертикальной виртуализацией"
        description="500 строк с переменной высотой и объединёнными ячейками в теле таблицы."
        data={virtualizedTableDataMock}
        availableBackgroundColors={availableBackgroundColorsMock}
      />
    </main>
  )
}
