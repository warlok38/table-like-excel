import { Table } from '@/components/table/table'
import { availableBackgroundColorsMock, editorModelDataMock, tableDataMock } from '@/mocks/table'

export default function Home() {
  return (
    <main>
      <h1>Table Like Excel</h1>
      <p>Доступно цветов заливки: {availableBackgroundColorsMock.length}</p>
      <Table data={tableDataMock} availableBackgroundColors={availableBackgroundColorsMock} />
      <section aria-labelledby="editor-model-title">
        <h2 id="editor-model-title">Модель редакторов и права ячеек</h2>
        <p>Проверка выделения, заливки и примечаний. Ввод значений появится в следующей фазе.</p>
        <Table
          data={editorModelDataMock}
          availableBackgroundColors={availableBackgroundColorsMock}
        />
      </section>
    </main>
  )
}
