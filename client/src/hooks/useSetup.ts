import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSetupStatus } from '@/lib/api'

interface SetupLine {
  text: string
  className: string
}

export function useSetup() {
  const [needsSetup, setNeedsSetup] = useState(false)
  const [cli, setCli] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [lines, setLines] = useState<SetupLine[]>([])
  const [scanning, setScanning] = useState(false)
  const [done, setDone] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSetupStatus()
      .then(d => {
        if (cancelled) return
        setNeedsSetup(d.needsSetup)
        setCli(d.cli)
        setChecking(false)
      })
      .catch(() => {
        if (!cancelled) setChecking(false)
      })
    return () => { cancelled = true }
  }, [])

  const startSetup = useCallback(() => {
    setScanning(true)
    setLines([])
    const es = new EventSource('/api/setup/run')
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.type === 'text' || d.type === 'info') {
          const txt = d.text || d.message || ''
          let className = ''
          if (txt.startsWith('\u2713') || txt.startsWith('\u2192')) className = 't-green'
          else if (txt.startsWith('\u26A0') || txt.startsWith('\u2717')) className = 't-coral'
          setLines(prev => [...prev, { text: txt, className }])
          if (txt.includes('AGENT_HUB_SETUP_COMPLETE')) {
            es.close()
            setDone(true)
            setScanning(false)
          }
        } else if (d.type === 'done' || d.type === 'error') {
          es.close()
          if (d.type === 'error') {
            setLines(prev => [...prev, { text: 'Error: ' + (d.message || 'unknown'), className: 't-coral' }])
          }
          setScanning(false)
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
      setScanning(false)
    }
  }, [])

  return { needsSetup, cli, checking, lines, scanning, done, startSetup }
}
