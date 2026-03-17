import type { AppView } from '@/types'
import { useCallback, useState } from 'react'
import { usePanesStore } from '@/store/panes'
import { useUIStore } from '@/store/ui'
import { useThemeStore } from '@/store/theme'
import { saveFile } from '@/lib/api'
import { Package } from 'lucide-react'
import { BreadcrumbPath } from './BreadcrumbPath'

interface TopBarProps {
  onRefresh?: () => Promise<void>
  activeView: AppView
  onViewSwitch: (view: AppView) => void
}

const navItems: { view: AppView; label: string }[] = [
  { view: 'crons', label: 'Crons' },
  { view: 'skills-lab', label: 'Skills' },
  { view: 'canvas', label: 'Canvas' },
  { view: 'headquarters', label: 'HQ' },
  { view: 'design-system', label: 'Tokens' },
]

export function TopBar({
  onRefresh,
  activeView,
  onViewSwitch,
}: TopBarProps) {
  const panes = usePanesStore(s => s.panes)
  const activePaneId = usePanesStore(s => s.activePaneId)
  const { flashSaved, toast } = useUIStore()
  const { theme, toggleTheme } = useThemeStore()
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
        <Package size={16} strokeWidth={1.5} className="topbar-brand-icon" />
        Agent Hub
      </div>
      <div className="view-switcher" role="tablist" aria-label="Mode switcher">
        {navItems.map(item => (
          <button
            key={item.view}
            className={`view-btn${activeView === item.view ? ' active' : ''}`}
            onClick={() => onViewSwitch(item.view)}
            role="tab"
            aria-selected={activeView === item.view}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="topbar-center">
        <BreadcrumbPath />
      </div>
      <div className="topbar-actions">
        <div
          className={`toggle-switch small${theme === 'dark' ? ' on' : ''}`}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          role="switch"
          aria-checked={theme === 'dark'}
        />
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
