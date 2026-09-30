'use client'

import { useState } from 'react'
import { Select } from 'antd'

interface ColorValueSelectProps {
  value?: string
  options: string[]
  disabled: boolean
  onChange(value: string): void
}

export function ColorValueSelect({ value, options, disabled, onChange }: ColorValueSelectProps) {
  const [search, setSearch] = useState('')
  const values = Array.from(new Set([...options, ...(value ? [value] : [])]))
  const candidate = search.trim()
  const choices = values.map((item) => ({ value: item, label: item }))
  if (candidate && !values.includes(candidate)) {
    choices.push({ value: candidate, label: `Добавить «${candidate}»` })
  }
  return (
    <Select<string>
      disabled={disabled}
      showSearch
      searchValue={search}
      onSearch={setSearch}
      value={value || undefined}
      options={choices}
      optionLabelProp="value"
      placeholder="Выберите или введите цвет"
      notFoundContent="Введите новый цвет"
      onOpenChange={(open) => {
        if (!open) setSearch('')
      }}
      onChange={(next) => {
        onChange(next)
        setSearch('')
      }}
    />
  )
}
