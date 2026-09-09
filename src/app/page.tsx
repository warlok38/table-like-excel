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
        <p>
          Проверка выделения, заливки, примечаний и локального ввода: Enter/двойной клик,
          Shift+Enter в textarea, Esc для отката и жёлтый маркер изменённых значений.
        </p>
        <Table
          data={editorModelDataMock}
          availableBackgroundColors={availableBackgroundColorsMock}
        />
      </section>
    </main>
  )
}
