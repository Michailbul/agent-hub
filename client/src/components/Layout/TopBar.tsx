import { useCallback } from 'react'
import { usePanesStore } from '@/store/panes'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { BreadcrumbPath } from './BreadcrumbPath'

export function TopBar() {
  const addPane = usePanesStore(s => s.addPane)
  const paneCount = usePanesStore(s => s.panes.length)
  const logoutFn = useAuthStore(s => s.logout)
  const showSaved = useUIStore(s => s.showSaved)

  const handleAddPane = useCallback(() => {
    addPane()
  }, [addPane])

  const handleLogout = useCallback(async () => {
    await logoutFn()
  }, [logoutFn])

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-ic">{'\u2699\uFE0F'}</div>
        <div>
          <div className="brand-n">
            Agent <span>Hub</span>
          </div>
          <div className="brand-s">Laniameda &middot; Studio</div>
        </div>
      </div>
      <div className="tsep" />
      <BreadcrumbPath />
      <div className="tr">
        <span className={`ss${showSaved ? ' show' : ''}`}>Saved \u2713</span>
        <button
          className="btn-o"
          onClick={handleAddPane}
          disabled={paneCount >= 4}
          style={{ opacity: paneCount >= 4 ? 0.4 : 1 }}
          title="Add empty pane — then drag a file into it"
        >
          + Pane
        </button>
        <button className="btn-o" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}
