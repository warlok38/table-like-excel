import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

export function ParameterRulesFeature({ children, fallback = null }: Props) {
  const parameterRulesEnabled = true

  return parameterRulesEnabled ? children : fallback
}
