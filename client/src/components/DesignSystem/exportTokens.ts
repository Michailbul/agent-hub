import type { TokenMap } from './tokenDefinitions'
import { TOKEN_DEFS } from './tokenDefinitions'

export function generateCSS(light: TokenMap, dark: TokenMap): string {
  const keys = TOKEN_DEFS.map(t => t.key)
  const lines: string[] = []

  lines.push('.s3-canvas[data-theme="light"] {')
  for (const k of keys) {
    if (light[k] != null) {
      lines.push(`  --${k}: ${light[k]};`)
    }
  }
  lines.push('}')
  lines.push('')
  lines.push('.s3-canvas[data-theme="dark"] {')
  for (const k of keys) {
    if (dark[k] != null) {
      lines.push(`  --${k}: ${dark[k]};`)
    }
  }
  lines.push('}')
  lines.push('')
  lines.push('.s3-canvas {')
  // Font and radius are shared
  if (light['sh-font']) lines.push(`  --sh-font: ${light['sh-font']};`)
  if (light['sh-font-mono']) lines.push(`  --sh-font-mono: ${light['sh-font-mono']};`)
  if (light['sh-radius'] != null) lines.push(`  --sh-radius: ${light['sh-radius']};`)
  lines.push('}')

  return lines.join('\n')
}

export async function copyCSS(light: TokenMap, dark: TokenMap): Promise<boolean> {
  const css = generateCSS(light, dark)
  try {
    await navigator.clipboard.writeText(css)
    return true
  } catch {
    return false
  }
}
