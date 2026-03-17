const SKILL_DOC_SUFFIX = '/SKILL.md'

export function getSkillDocumentPath(variantPath: string): string {
  const normalized = variantPath.trim()
  if (!normalized) return ''
  if (normalized.endsWith(SKILL_DOC_SUFFIX)) return normalized
  return `${normalized.replace(/\/+$/, '')}${SKILL_DOC_SUFFIX}`
}

export function getSkillDirectoryPath(variantPath: string): string {
  const skillDocumentPath = getSkillDocumentPath(variantPath)
  return skillDocumentPath.endsWith(SKILL_DOC_SUFFIX)
    ? skillDocumentPath.slice(0, -SKILL_DOC_SUFFIX.length)
    : skillDocumentPath
}
