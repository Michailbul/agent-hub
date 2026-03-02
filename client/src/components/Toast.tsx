import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/ui'

export function Toast() {
  const msg = useUIStore(s => s.toastMsg)
  const type = useUIStore(s => s.toastType)
  const key = useUIStore(s => s.toastKey)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!msg) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(t)
  }, [msg, key])

  return (
    <div className={`toast${visible ? ' show' : ''}${type ? ' ' + type : ''}`}>
      {msg}
    </div>
  )
}
