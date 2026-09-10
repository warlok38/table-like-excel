import { TableDemoClient } from './table-demo-client'
import {
  availableBackgroundColorsMock,
  editorModelDataMock,
  noDataStatusTableMock,
  tableDataMock
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
        title="Таблица без DataStatus"
        description="Проверка режима, где DataStatus не пришёл ни для одной ячейки."
        data={noDataStatusTableMock}
        availableBackgroundColors={availableBackgroundColorsMock}
      />
    </main>
  )
}
