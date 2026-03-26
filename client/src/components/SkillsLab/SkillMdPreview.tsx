import { useMemo } from 'react'
import { marked } from 'marked'

interface SkillMdPreviewProps {
  content: string
  prefix?: string
}

// Configure marked for safe, clean output
marked.setOptions({ gfm: true, breaks: false })

export function SkillMdPreview({ content, prefix = 'sc' }: SkillMdPreviewProps) {
  const html = useMemo(() => {
    try {
      return marked.parse(content) as string
    } catch {
      return `<pre>${content.replace(/</g, '&lt;')}</pre>`
    }
  }, [content])

  return (
    <div
      className={`${prefix}-md-preview`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
