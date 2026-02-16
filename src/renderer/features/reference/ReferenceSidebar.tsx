import { useMemo, useState } from 'react'
import { useProjectStore } from '@/renderer/store/projectStore'
import type { BeatType } from '@/shared/model'
import { referenceSections, type ReferenceSectionId } from './referenceData'

function beatTypeToSectionId(type: BeatType | null): ReferenceSectionId {
  switch (type) {
    case 'scene-heading':
      return 'scene-heading'
    case 'action':
      return 'action'
    case 'character-cue':
      return 'character-cue'
    case 'dialogue':
      return 'dialogue'
    case 'parenthetical':
      return 'parenthetical'
    case 'transition':
      return 'transition'
    case 'choice-point':
      return 'choice-point'
    case 'set-variable':
      return 'set-variable'
    default:
      return 'scene-heading'
  }
}

export function ReferenceSidebar() {
  const activeBeatType = useProjectStore((s) => s.activeBeatType)
  const [pinnedSectionId, setPinnedSectionId] = useState<ReferenceSectionId | null>(null)

  const effectiveSectionId = useMemo<ReferenceSectionId>(() => {
    if (pinnedSectionId) return pinnedSectionId
    return beatTypeToSectionId(activeBeatType ?? null)
  }, [activeBeatType, pinnedSectionId])

  const sections = referenceSections
  const activeSection = sections.find((s) => s.id === effectiveSectionId) ?? sections[0]

  const isPinned = pinnedSectionId !== null

  return (
    <aside className="w-72 border-l border-border bg-[rgb(var(--bg-muted))] flex flex-col shrink-0">
      <header className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">
            Reference
          </span>
          <span className="text-sm text-[rgb(var(--text))]">
            {activeSection.title}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isPinned) {
              setPinnedSectionId(null)
            } else {
              setPinnedSectionId(effectiveSectionId)
            }
          }}
          className="text-xs px-2 py-1 rounded border border-border bg-[rgb(var(--bg))] hover:bg-[rgb(var(--border))]"
          aria-pressed={isPinned}
          aria-label={isPinned ? 'Unpin reference section' : 'Pin current reference section'}
        >
          {isPinned ? 'Pinned' : 'Auto'}
        </button>
      </header>

      <div className="px-3 py-2 border-b border-border overflow-x-auto">
        <div className="flex gap-1">
          {sections.map((section) => {
            const selected = section.id === effectiveSectionId
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setPinnedSectionId(section.id)}
                className={`text-xs rounded-full px-2 py-1 border ${
                  selected
                    ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-white'
                    : 'border-border bg-[rgb(var(--bg))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]'
                }`}
              >
                {section.title}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 py-3 space-y-3 text-xs text-[rgb(var(--text))]">
        {activeSection.summary && (
          <p className="text-[rgb(var(--text-muted))]">{activeSection.summary}</p>
        )}

        {activeSection.shortcuts && activeSection.shortcuts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activeSection.shortcuts.map((sc) => (
              <span
                key={sc}
                className="inline-flex items-center rounded border border-border bg-[rgb(var(--bg))] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[rgb(var(--text-muted))]"
              >
                {sc}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {activeSection.entries.map((entry) => (
            <div key={entry.label} className="border border-border rounded px-2 py-1.5 bg-[rgb(var(--bg))]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-[rgb(var(--text))]">
                  {entry.label}
                </span>
              </div>
              <p className="text-[rgb(var(--text-muted))]">
                {entry.description}
              </p>
              {entry.example && (
                <pre className="mt-1 text-[10px] whitespace-pre-wrap bg-[rgb(var(--bg-muted))] border border-border rounded px-1.5 py-1 text-[rgb(var(--text))]">
                  {entry.example}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

