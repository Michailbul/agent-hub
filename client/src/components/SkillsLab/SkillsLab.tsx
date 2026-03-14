import { V11Kiln } from './V11Kiln'
import { V11KilnLight } from './V11KilnLight'

interface SkillsLabProps {
  theme?: 'light' | 'dark'
}

export function SkillsLab({ theme = 'light' }: SkillsLabProps) {
  return (
    <div className="sl-root">
      {theme === 'light' ? <V11KilnLight /> : <V11Kiln />}
    </div>
  )
}
