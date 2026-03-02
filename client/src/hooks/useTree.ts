import { useState, useEffect, useCallback } from 'react'
import type { TreeData } from '@/types'
import { fetchTree } from '@/lib/api'

export function useTree() {
  const [data, setData] = useState<TreeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const tree = await fetchTree()
      setData(tree)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { data, loading, error, refetch: load }
}
