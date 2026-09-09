import { TableDemoClient } from './table-demo-client'
import { availableBackgroundColorsMock, editorModelDataMock, tableDataMock } from '@/mocks/table'

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
    </main>
  )
}
