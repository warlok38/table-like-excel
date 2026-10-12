import type { ParameterCatalogItem } from '../model/parameterRules'
import styles from './ParameterDetails.module.css'

// Reserve space for every value and split the remaining width between long values.
const shortDetailLength = 16

export function ParameterDetails({ parameter }: { parameter?: ParameterCatalogItem }) {
  const details = [
    { item: parameter?.planType, missing: 'План не задан' },
    { item: parameter?.aggregationRule, missing: 'Агрегация не задана' },
    { item: parameter?.shift, missing: 'Смена не задана' },
    { item: parameter?.aggregationLevel, missing: 'Уровень не задан' }
  ]
  const hasLongDetails = details.some(
    ({ item, missing }) => (item?.name ?? missing).length > shortDetailLength
  )

  return (
    <div className={styles.details}>
      {details.map(({ item, missing }) => {
        const value = item?.name ?? missing
        const isLong = value.length > shortDetailLength
        let flex: string | undefined
        if (hasLongDetails) {
          flex = isLong ? '1 1 0' : '0 1 auto'
        }
        return (
          <span
            className={styles.detail}
            key={missing}
            style={{ flex, minWidth: hasLongDetails ? 80 : undefined }}
          >
            <span className={styles.detailValue} title={value}>
              {value}
            </span>
          </span>
        )
      })}
    </div>
  )
}
