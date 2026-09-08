import { Table } from '@/components/table/table'
import { availableBackgroundColorsMock, tableDataMock } from '@/mocks/table'

export default function Home() {
  return (
    <main>
      <h1>Table Like Excel</h1>
      <p>Доступно цветов заливки: {availableBackgroundColorsMock.length}</p>
      <Table data={tableDataMock} availableBackgroundColors={availableBackgroundColorsMock} />
    </main>
  )
}
