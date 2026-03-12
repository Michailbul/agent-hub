import { V11Kiln } from './V11Kiln'
import { V11KilnLight } from './V11KilnLight'

interface SkillsLabProps {
  variant?: 'light'
}

export function SkillsLab({ variant }: SkillsLabProps) {
  return (
    <div className="sl-root">
      {variant === 'light' ? <V11KilnLight /> : <V11Kiln />}
    </div>
  )
}
