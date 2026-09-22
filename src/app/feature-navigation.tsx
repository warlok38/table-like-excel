'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import styles from './feature-navigation.module.css'

const navigationItems = [
  { href: '/', label: 'Главная' },
  { href: '/features/custom-table', label: 'Фича 1' },
  { href: '/features/antd-table', label: 'Фича 2' }
]

export function FeatureNavigation() {
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/">
        Testing features
      </Link>
      <nav aria-label="Навигация по фичам" className={styles.navigation}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={styles.navigationLink}
              data-active={isActive}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
