import { useEffect, useCallback, useState, lazy, Suspense } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePanesStore } from '@/store/panes'
import { useUIStore } from '@/store/ui'
import { useSetup } from '@/hooks/useSetup'
import { useTree } from '@/hooks/useTree'
import { saveFile } from '@/lib/api'
import { LoginForm } from '@/components/Auth/LoginForm'
import { SetupOverlay } from '@/components/Setup/SetupOverlay'
import { TopBar } from '@/components/Layout/TopBar'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { PaneManager } from '@/components/Editor/PaneManager'
import { Toast } from '@/components/Toast'
import { CronsPanel } from '@/components/Crons/CronsPanel'
import { CanvasView } from '@/components/Canvas/CanvasView'
import { SkillsLab } from '@/components/SkillsLab/SkillsLab'
import { HeadquartersPage } from '@/components/Headquarters/HeadquartersPage'
import type { AppView } from '@/types'

const ShadcnSkillsLab1 = lazy(() => import('@/components/SkillsLab/ShadcnSkillsLab1').then(m => ({ default: m.ShadcnSkillsLab1 })))
const ShadcnSkillsLab2 = lazy(() => import('@/components/SkillsLab/ShadcnSkillsLab2').then(m => ({ default: m.ShadcnSkillsLab2 })))

export function App() {
  const { isAuthenticated, isChecking, check } = useAuthStore()
  const { needsSetup, checking: setupChecking } = useSetup()
  const { data: tree, refetch: refetchTree } = useTree()
  const addPane = usePanesStore(s => s.addPane)
  const panes = usePanesStore(s => s.panes)
  const [activeView, setActiveViewRaw] = useState<AppView>(() => {
    const path = window.location.pathname
    if (path === '/shadcn-ui-1') return 'shadcn-ui-1'
    if (path === '/shadcn-ui-2') return 'shadcn-ui-2'
    return 'editor'
  })
  const setActiveView = useCallback((view: AppView) => {
    setActiveViewRaw(view)
    const path = view === 'shadcn-ui-1' ? '/shadcn-ui-1'
      : view === 'shadcn-ui-2' ? '/shadcn-ui-2' : '/'
    window.history.pushState(null, '', path)
  }, [])
  const [skillsLabTheme, setSkillsLabTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem('skills-lab-theme') === 'dark' ? 'dark' : 'light'
  })
  const activePaneId = usePanesStore(s => s.activePaneId)
  const { flashSaved, toast } = useUIStore()
  const [dropVisible, setDropVisible] = useState(false)

  useEffect(() => {
    void check()
  }, [check])

  // Add initial pane once authenticated
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (isAuthenticated && !initialized) {
      addPane()
      setInitialized(true)
    }
  }, [isAuthenticated, initialized, addPane])

  // Global Ctrl+S handler
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const pane = panes.find(p => p.id === activePaneId)
        if (pane?.path && !pane.isLocal) {
          try {
            await saveFile(pane.path, pane.content)
            usePanesStore.getState().setDirty(pane.id, false)
            flashSaved()
            toast('Saved', 'success')
          } catch {
            toast('Save failed', 'error')
          }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [panes, activePaneId, flashSaved, toast])

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (panes.some(p => p.isDirty)) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [panes])

  useEffect(() => {
    window.localStorage.setItem('skills-lab-theme', skillsLabTheme)
  }, [skillsLabTheme])

  // Local file drop handling
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setDropVisible(true)
    }
  }, [])
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault()
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const area = e.currentTarget
    if (!area.contains(e.relatedTarget as Node)) setDropVisible(false)
  }, [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      setDropVisible(false)
      const files = Array.from(e.dataTransfer.files).filter(
        f => f.name.endsWith('.md') || f.name.endsWith('.txt'),
      )
      if (!files.length) {
        toast('Only .md and .txt files supported', 'error')
        return
      }
      e.preventDefault()
      files.slice(0, 4 - panes.length + 1).forEach((file, i) => {
        const reader = new FileReader()
        reader.onload = ev => {
          const content = ev.target?.result as string
          const activePane = panes.find(p => p.id === activePaneId)
          if (activePane && !activePane.path && i === 0) {
            // Use active empty pane
            usePanesStore.getState().openFileInPane(activePaneId!, '', file.name, content)
            const state = usePanesStore.getState()
            const p = state.panes.find(p => p.id === activePaneId)
            if (p) {
              // Mark as local and dirty
              usePanesStore.setState(s => ({
                panes: s.panes.map(pp =>
                  pp.id === activePaneId
                    ? { ...pp, path: null, label: file.name, isDirty: true, isLocal: true, content }
                    : pp,
                ),
              }))
            }
          } else {
            const newId = usePanesStore.getState().addPane(null, file.name, content, true)
            if (newId) {
              usePanesStore.setState(s => ({
                panes: s.panes.map(pp =>
                  pp.id === newId ? { ...pp, isDirty: true, isLocal: true } : pp,
                ),
              }))
            }
          }
          toast(`Loaded ${file.name} — assign to save`, '')
        }
        reader.readAsText(file)
      })
    },
    [panes, activePaneId, toast],
  )

  // Loading states
  if (setupChecking || isChecking) return null
  if (needsSetup) return <><SetupOverlay /><Toast /></>
  if (!isAuthenticated) return <><LoginForm /><Toast /></>

  const shadcnFallback = <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>Loading…</div>

  return (
    <div className={`app${activeView === 'skills-lab' ? ` app-skills-lab app-skills-lab-${skillsLabTheme}` : ''}`}>
      <TopBar
        onRefresh={async () => {
          await refetchTree()
        }}
        activeView={activeView}
        onViewSwitch={setActiveView}
        skillsLabTheme={skillsLabTheme}
        onToggleSkillsLabTheme={() => setSkillsLabTheme(current => current === 'dark' ? 'light' : 'dark')}
      />
      <div className="app-body">
        {activeView === 'shadcn-ui-1'
          ? <Suspense fallback={shadcnFallback}><ShadcnSkillsLab1 /></Suspense>
          : activeView === 'shadcn-ui-2'
          ? <Suspense fallback={shadcnFallback}><ShadcnSkillsLab2 /></Suspense>
          : activeView === 'canvas'
          ? <CanvasView onNavigateToFiles={() => setActiveView('editor')} themeClass="cv-b1-anthro" />
          : activeView === 'headquarters'
          ? <HeadquartersPage />
          : activeView === 'skills-lab'
          ? <SkillsLab theme={skillsLabTheme} />
          : activeView === 'crons'
          ? <CronsPanel />
          : <>
              <Sidebar tree={tree} />
              <div
                className="editor-area"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`drop-overlay${dropVisible ? ' show' : ''}`}>
                  <div className="do-icon">{'\uD83D\uDCC4'}</div>
                  <div className="do-title">Drop Markdown File</div>
                  <div className="do-sub">Release to open in a new pane</div>
                </div>
                <PaneManager />
              </div>
            </>
        }
      </div>
      <Toast />
    </div>
  )
}
