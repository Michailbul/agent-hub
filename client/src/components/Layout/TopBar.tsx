import { useCallback, useState } from 'react'
import { usePanesStore } from '@/store/panes'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { BreadcrumbPath } from './BreadcrumbPath'

interface TopBarProps {
  onRefresh?: () => Promise<void>
}

export function TopBar({ onRefresh }: TopBarProps) {
  const addPane = usePanesStore(s => s.addPane)
  const paneCount = usePanesStore(s => s.panes.length)
  const logoutFn = useAuthStore(s => s.logout)
  const showSaved = useUIStore(s => s.showSaved)
  const { toast } = useUIStore()
  const [refreshing, setRefreshing] = useState(false)

  const handleAddPane = useCallback(() => addPane(), [addPane])
  const handleLogout = useCallback(async () => { await logoutFn() }, [logoutFn])

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const r = await fetch('/api/refresh', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Refresh failed')
      if (onRefresh) await onRefresh()
      toast(`↻ ${d.agents} agents · ${d.libs} skill libs`, 'success')
    } catch (e) {
      toast(`Refresh failed: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, onRefresh, toast])

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-ic">⚙️</div>
        <div>
          <div className="brand-n">Agent <span>Hub</span></div>
          <div className="brand-s">Laniameda &middot; Studio</div>
        </div>
      </div>
      <div className="tsep" />
      <BreadcrumbPath />
      <div className="tr">
        <span className={`ss${showSaved ? ' show' : ''}`}>Saved ✓</span>
        <button
          className="btn-o btn-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Rescan agents and skills — preserves open files"
        >
          <span className={`refresh-icon${refreshing ? ' spin' : ''}`}>↻</span>
          {refreshing ? 'Scanning…' : 'Refresh'}
        </button>
        <button
          className="btn-o"
          onClick={handleAddPane}
          disabled={paneCount >= 4}
          style={{ opacity: paneCount >= 4 ? 0.4 : 1 }}
          title="Add empty pane — drag a file into it"
        >
          + Pane
        </button>
        <button className="btn-o" onClick={handleLogout}>Sign out</button>
      </div>
    </div>
  )
}
