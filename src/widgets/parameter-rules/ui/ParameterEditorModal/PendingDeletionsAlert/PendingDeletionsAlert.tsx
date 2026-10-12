import { useState } from 'react'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { Alert, Button } from 'antd'
import styles from './PendingDeletionsAlert.module.css'

interface Props {
  items: { key: string; label: string; restore(): void }[]
  disabled: boolean
  onRestoreAll(): void
}

export function PendingDeletionsAlert({ items, disabled, onRestoreAll }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Alert
      className={styles.alert}
      type="info"
      onClick={(event) => {
        if ((event.target as Element).closest('button')) return
        setExpanded((current) => !current)
      }}
      title={
        <div>
          <div className={styles.header}>
            <span>Ожидают удаления: {items.length}</span>
            <Button
              className={styles.link}
              type="link"
              size="small"
              disabled={disabled}
              onClick={onRestoreAll}
            >
              Отменить всё
            </Button>
            <span className={styles.toggle} title={expanded ? 'Скрыть список' : 'Показать список'}>
              {expanded ? <UpOutlined /> : <DownOutlined />}
            </span>
          </div>
          {expanded && (
            <div className={styles.list}>
              {items.map((item) => (
                <div className={styles.item} key={item.key}>
                  <span>{item.label}</span>
                  <Button
                    className={styles.link}
                    type="link"
                    size="small"
                    disabled={disabled}
                    onClick={item.restore}
                  >
                    Отменить удаление
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  )
}
