import { useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'

const SKILL_TAG_REGEX = /\[skill:\s*([^\]]+)\]/gi

type DetectedSkill = {
  id: string
  name: string
  start: number
  end: number
}

type SkillCommand = {
  query: string
  start: number
  end: number
}

type PromptComposerProps = {
  value: string
  onChange: (v: string) => void
  onInsertSkill: (name: string) => void
  skills: string[]
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

function detectSkills(value: string): DetectedSkill[] {
  const found: DetectedSkill[] = []
  let match: RegExpExecArray | null

  while ((match = SKILL_TAG_REGEX.exec(value)) !== null) {
    const token = match[0]
    const name = (match[1] || '').trim()
    found.push({
      id: `${match.index}-${token}`,
      name,
      start: match.index,
      end: match.index + token.length,
    })
  }

  SKILL_TAG_REGEX.lastIndex = 0
  return found
}

function getCommandAtCursor(value: string, cursor: number): SkillCommand | null {
  const safeCursor = Math.max(0, Math.min(cursor, value.length))
  const lineStart = value.lastIndexOf('\n', safeCursor - 1) + 1
  const line = value.slice(lineStart, safeCursor)
  const markerIndex = line.lastIndexOf('/skill')
  if (markerIndex === -1) return null

  const markerAbsolute = lineStart + markerIndex
  if (markerIndex > 0) {
    const prev = line[markerIndex - 1]
    if (prev && /\S/.test(prev)) return null
  }

  const raw = line.slice(markerIndex + '/skill'.length)
  return {
    query: raw.trim(),
    start: markerAbsolute,
    end: safeCursor,
  }
}

export function PromptComposer({ value, onChange, onInsertSkill, skills, textareaRef }: PromptComposerProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null)
  const inputRef = textareaRef ?? localRef
  const [cursor, setCursor] = useState(0)

  const detectedSkills = useMemo(() => detectSkills(value), [value])

  const command = useMemo(() => getCommandAtCursor(value, cursor), [cursor, value])

  const commandSkills = useMemo(() => {
    if (!command) return []
    const query = command.query.toLowerCase()

    return skills
      .filter(name => !query || name.toLowerCase().includes(query))
      .slice(0, 12)
  }, [command, skills])

  const showAutocomplete = Boolean(command && commandSkills.length > 0)

  const setCursorFromTarget = (target: HTMLTextAreaElement) => {
    setCursor(target.selectionStart ?? target.value.length)
  }

  const removeSkillAt = (skill: DetectedSkill) => {
    const next = `${value.slice(0, skill.start)}${value.slice(skill.end)}`
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd()
    onChange(next)
  }

  const applyCommandSkill = (skillName: string) => {
    if (!command) {
      onInsertSkill(skillName)
      return
    }

    const token = `[skill: ${skillName}]`
    const next = `${value.slice(0, command.start)}${token}${value.slice(command.end)}`
    onChange(next)

    requestAnimationFrame(() => {
      const node = inputRef.current
      if (!node) return
      const pos = command.start + token.length
      node.focus()
      node.setSelectionRange(pos, pos)
      setCursor(pos)
    })
  }

  return (
    <div className="prompt-composer">
      <div
        className="prompt-input-wrap"
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault()
          const skillName =
            event.dataTransfer.getData('application/x-agent-hub-skill') ||
            event.dataTransfer.getData('text/plain')

          if (skillName.trim()) onInsertSkill(skillName.trim())
        }}
      >
        <textarea
          ref={inputRef}
          className="cron-input cron-textarea"
          rows={14}
          value={value}
          onChange={event => {
            onChange(event.target.value)
            setCursorFromTarget(event.target)
          }}
          onClick={event => setCursorFromTarget(event.currentTarget)}
          onKeyUp={event => setCursorFromTarget(event.currentTarget)}
          onSelect={event => setCursorFromTarget(event.currentTarget)}
          placeholder="What should this agent do?"
        />

        {showAutocomplete && (
          <div className="skill-autocomplete">
            {commandSkills.map(skillName => (
              <button
                key={skillName}
                className="skill-autocomplete-item"
                onMouseDown={event => {
                  event.preventDefault()
                  applyCommandSkill(skillName)
                }}
              >
                {skillName}
              </button>
            ))}
          </div>
        )}
      </div>

      {detectedSkills.length > 0 && (
        <div className="prompt-chips-wrap">
          <div className="cron-label">Detected skills:</div>
          <div className="prompt-chips">
            {detectedSkills.map(skill => (
              <span key={skill.id} className="prompt-chip">
                {skill.name}
                <button onClick={() => removeSkillAt(skill)} aria-label={`Remove ${skill.name}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
