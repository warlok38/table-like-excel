import type { ParameterCatalogItem } from '../../model/parameterRules'
import styles from './ParameterDetails.module.css'

export function ParameterDetails({ parameter }: { parameter?: ParameterCatalogItem }) {
  const details = [
    { item: parameter?.planType, missing: 'План не задан' },
    { item: parameter?.aggregationRule, missing: 'Агрегация не задана' },
    { item: parameter?.shift, missing: 'Смена не задана' },
    { item: parameter?.aggregationLevel, missing: 'Уровень не задан' }
  ]

  return (
    <div className={styles.details}>
      {details.map(({ item, missing }) => {
        const value = item?.description ?? missing

        return (
          <span className={styles.detail} key={missing}>
            <span className={styles.detailValue} title={value}>
              {value}
            </span>
          </span>
        )
      })}
    </div>
  )
}
