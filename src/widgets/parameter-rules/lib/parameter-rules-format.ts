const parameterUpdatedAtFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export function formatParameterUpdatedAt(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '—' : parameterUpdatedAtFormatter.format(date)
}

export function formatRulesLabel(count: number): string {
  return `Правила: ${count}`
}
