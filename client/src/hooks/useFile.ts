import { useCallback } from 'react'
import { fetchFile, saveFile } from '@/lib/api'

export function useFile() {
  const readFile = useCallback(async (path: string) => {
    return fetchFile(path)
  }, [])

  const writeFile = useCallback(async (path: string, content: string) => {
    return saveFile(path, content)
  }, [])

  return { readFile, saveFile: writeFile }
}
