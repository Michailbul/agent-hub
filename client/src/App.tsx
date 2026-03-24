import { useEffect, useCallback, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useSetup } from '@/hooks/useSetup'
import { useTree } from '@/hooks/useTree'
import { LoginForm } from '@/components/Auth/LoginForm'
import { SetupOverlay } from '@/components/Setup/SetupOverlay'
import { TopBar } from '@/components/Layout/TopBar'
import { Toast } from '@/components/Toast'
import { CanvasView } from '@/components/Canvas/CanvasView'
import { SkillsLabStudio as SkillsLab } from '@/components/SkillsLab/SkillsLabStudio'
import { HeadquartersPage } from '@/components/Headquarters/HeadquartersPage'
import type { AppView } from '@/types'

export function App() {
  const { isAuthenticated, isChecking, check } = useAuthStore()
  const { needsSetup, checking: setupChecking } = useSetup()
  const { refetch: refetchTree } = useTree()
  const [activeView, setActiveViewRaw] = useState<AppView>('skills-lab')
  const setActiveView = useCallback((view: AppView) => {
    setActiveViewRaw(view)
    window.history.pushState(null, '', '/')
  }, [])

  useEffect(() => {
    void check()
  }, [check])

  // Loading states
  if (setupChecking || isChecking) return null
  if (needsSetup) return <><SetupOverlay /><Toast /></>
  if (!isAuthenticated) return <><LoginForm /><Toast /></>

  return (
    <div className={`app${activeView === 'skills-lab' ? ' app-skills-lab' : ''}`}>
      <TopBar
        onRefresh={async () => {
          await refetchTree()
        }}
        activeView={activeView}
        onViewSwitch={setActiveView}
      />
      <div className="app-body">
        {activeView === 'canvas'
          ? <CanvasView themeClass="cv-b1-anthro" />
          : activeView === 'headquarters'
          ? <HeadquartersPage />
          : <SkillsLab />
        }
      </div>
      <Toast />
    </div>
  )
}
