import type { DraftRule } from './parameterRuleDraft'

export function restoreRemovedRules(current: DraftRule[], initial: DraftRule[]): DraftRule[] {
  const restored = current.map((rule) => {
    const before = initial.find((item) => item.id === rule.id)
    if (!before) return rule

    const removedUiRules = before.uiRules.filter(
      (item) => item.id && !rule.uiRules.some((next) => next.id === item.id)
    )
    const removedNotifications = before.notifications.filter(
      (item) => item.id && !rule.notifications.some((next) => next.id === item.id)
    )
    if (!removedUiRules.length && !removedNotifications.length) return rule

    return {
      ...rule,
      uiRules: removedUiRules.length
        ? [
            ...rule.uiRules.filter(
              (item) => !removedUiRules.some((removed) => removed.key === item.key)
            ),
            ...structuredClone(removedUiRules)
          ]
        : rule.uiRules,
      notifications: removedNotifications.length
        ? [...rule.notifications, ...structuredClone(removedNotifications)]
        : rule.notifications
    }
  })

  return [
    ...restored,
    ...structuredClone(initial.filter((before) => !current.some((rule) => rule.id === before.id)))
  ]
}
