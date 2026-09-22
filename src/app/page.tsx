import Link from 'next/link'

import styles from './page.module.css'

const features = [
  {
    href: '/features/custom-table',
    title: 'Кастомная таблица',
    description: 'Текущая Excel-подобная таблица с выделением, цветами и заметками.'
  },
  {
    href: '/features/antd-table',
    title: 'Таблица Ant Design',
    description: 'Площадка для следующей реализации таблицы на компонентах Ant Design.'
  }
]

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Testing features</p>
        <h1 className={styles.title}>Фичи проекта</h1>
        <p className={styles.description}>
          Выберите реализацию, которую хотите открыть или развивать.
        </p>
      </div>

      <div className={styles.featureGrid}>
        {features.map((feature, index) => (
          <Link className={styles.featureCard} href={feature.href} key={feature.href}>
            <span className={styles.featureNumber}>Фича {index + 1}</span>
            <strong className={styles.featureTitle}>{feature.title}</strong>
            <span className={styles.featureDescription}>{feature.description}</span>
            <span className={styles.featureLink}>Открыть →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
