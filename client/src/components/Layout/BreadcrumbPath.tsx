import { usePanesStore } from '@/store/panes'

export function BreadcrumbPath() {
  const activePane = usePanesStore(s => s.panes.find(p => p.id === s.activePaneId))
  const text = activePane?.path
    ? activePane.path
        .replace(/^\/Users\/[^/]+\//, '~/')
        .replace(/^\/root\//, '~/')
    : 'Open a file or drop .md from your machine'

  return <div className="bc">{text}</div>
}
