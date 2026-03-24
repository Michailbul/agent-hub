import type { AppView } from '@/types'
import { useCallback, useState } from 'react'
import { useUIStore } from '@/store/ui'
import { useThemeStore } from '@/store/theme'
import { Package } from 'lucide-react'

interface TopBarProps {
  onRefresh?: () => Promise<void>
  activeView: AppView
  onViewSwitch: (view: AppView) => void
}

const navItems: { view: AppView; label: string }[] = [
  { view: 'skills-lab', label: 'Skills' },
  { view: 'canvas', label: 'Canvas' },
  { view: 'headquarters', label: 'HQ' },
]

export function TopBar({
  onRefresh,
  activeView,
  onViewSwitch,
}: TopBarProps) {
  const { toast } = useUIStore()
  const { theme, toggleTheme } = useThemeStore()
  const [refreshing, setRefreshing] = useState(false)

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
      <div className="topbar-center" />
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
      </div>
    </div>
  )
}
