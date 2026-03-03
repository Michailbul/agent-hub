import { useCallback, useState } from 'react'
import { usePanesStore } from '@/store/panes'
import { useUIStore } from '@/store/ui'
import { saveFile } from '@/lib/api'
import { BreadcrumbPath } from './BreadcrumbPath'

interface TopBarProps {
  onRefresh?: () => Promise<void>
}

export function TopBar({ onRefresh }: TopBarProps) {
  const panes = usePanesStore(s => s.panes)
  const activePaneId = usePanesStore(s => s.activePaneId)
  const { flashSaved, toast } = useUIStore()
  const [refreshing, setRefreshing] = useState(false)

  const activePane = panes.find(p => p.id === activePaneId)

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

  const handleSave = useCallback(async () => {
    if (!activePane?.path || activePane.isLocal) return
    try {
      await saveFile(activePane.path, activePane.content)
      usePanesStore.getState().setDirty(activePane.id, false)
      flashSaved()
      toast('Saved', 'success')
    } catch {
      toast('Save failed', 'error')
    }
  }, [activePane, flashSaved, toast])

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="topbar-brand-icon">⚙️</span>
        Agent Hub
      </div>
      <div className="topbar-center">
        <BreadcrumbPath />
      </div>
      <div className="topbar-actions">
        <button
          className="tb-btn-ghost"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Rescan agents and skills"
        >
          <span className={`refresh-icon${refreshing ? ' spin' : ''}`}>↻</span>
          {refreshing ? 'Scanning…' : 'Refresh'}
        </button>
        {activePane?.isDirty && !activePane.isLocal && (
          <button className="tb-btn-save" onClick={handleSave}>Save</button>
        )}
      </div>
    </div>
  )
}
