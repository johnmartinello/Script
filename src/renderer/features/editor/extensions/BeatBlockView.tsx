import type { ReactNodeViewProps } from '@tiptap/react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useProjectStore } from '@/renderer/store/projectStore'
import type { BeatType } from '@/shared/model'
import type { ChoiceOption } from '@/shared/model'

const beatLabels: Record<BeatType, string> = {
  'scene-heading': 'SCENE',
  action: 'Action',
  'character-cue': 'Character',
  dialogue: 'Dialogue',
  parenthetical: 'Parenthetical',
  transition: 'Transition',
  'choice-point': 'Choice',
  'set-variable': 'Set Variable',
}

const beatShortcutLabels: Partial<Record<BeatType, string>> = {
  'scene-heading': 'Ctrl+1',
  action: 'Ctrl+2',
  'character-cue': 'Ctrl+3',
  dialogue: 'Ctrl+4',
  parenthetical: 'Ctrl+5',
  transition: 'Ctrl+6',
  'choice-point': 'Ctrl+7',
}

export function BeatBlockView(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props
  const type = (node.attrs.beatType ?? 'scene-heading') as BeatType
  const options = (node.attrs.options ?? null) as ChoiceOption[] | null
  const isChoice = type === 'choice-point'
  const scenes = useProjectStore((s) => s.project.scenes)
  const selectedSceneId = useProjectStore((s) => s.selectedSceneId)
  const updateChoiceOption = useProjectStore((s) => s.updateChoiceOption)
  const beatId = (node.attrs.beatId ?? '') as string

  const className =
    type === 'scene-heading'
      ? 'font-bold uppercase text-sm text-[rgb(var(--text-muted))]'
      : type === 'character-cue'
        ? 'text-center font-semibold'
        : type === 'transition'
          ? 'text-right text-sm'
          : type === 'choice-point'
            ? 'border border-[rgb(var(--border))] rounded p-2 bg-[rgb(var(--bg-muted))]'
            : ''

  return (
    <NodeViewWrapper as="div" data-beat="" className="my-1">
      <div className={`flex items-baseline gap-2 ${isChoice ? 'flex-col' : ''}`}>
        <BeatTypeDropdown type={type} onChange={(next) => {
          const attrs: Record<string, unknown> = {
            ...node.attrs,
            beatType: next,
          }
          if (next === 'choice-point' && !Array.isArray(options)) {
            attrs.options = []
          }
          if (next !== 'choice-point') {
            attrs.options = null
          }
          updateAttributes(attrs)
        }} />
        {isChoice ? (
          <div className="flex-1 space-y-1">
            {(options ?? []).map((opt) => (
              <div key={opt.id} className="flex gap-2 text-sm items-center flex-wrap">
                <span className="text-[rgb(var(--text-muted))] shrink-0">→</span>
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => {
                    const next = (options ?? []).map((o) =>
                      o.id === opt.id ? { ...o, label: e.target.value } : o
                    )
                    updateAttributes({ options: next })
                  }}
                  placeholder="Choice label"
                  className="flex-1 min-w-0 bg-transparent border-b border-border px-1 py-0.5 text-sm focus:outline-none focus:border-[rgb(var(--accent))]"
                />
                <select
                  value={opt.targetSceneId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value || null
                    const next = (options ?? []).map((o) =>
                      o.id === opt.id ? { ...o, targetSceneId: val } : o
                    )
                    updateAttributes({ options: next })
                    if (selectedSceneId) {
                      updateChoiceOption(selectedSceneId, beatId, opt.id, {
                        targetSceneId: val,
                        label: opt.label,
                      })
                    }
                  }}
                  className="text-xs bg-[rgb(var(--bg))] border border-border rounded px-1 py-0.5"
                >
                  <option value="">No scene</option>
                  {scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(options ?? []),
                  {
                    id: crypto.randomUUID(),
                    label: '',
                    targetSceneId: null,
                    condition: '',
                  },
                ]
                updateAttributes({ options: next })
              }}
              className="text-xs text-[rgb(var(--accent))] hover:underline"
            >
              + Option
            </button>
          </div>
        ) : (
          <NodeViewContent className={`flex-1 min-w-0 ${className}`} />
        )}
      </div>
    </NodeViewWrapper>
  )
}

function BeatTypeDropdown({
  type,
  onChange,
}: {
  type: BeatType
  onChange: (next: BeatType) => void
}) {
  return (
    <button
      type="button"
      className="shrink-0 text-xs text-left text-[rgb(var(--text-muted))] w-24 flex flex-col gap-0.5"
      contentEditable={false}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        // Simple cycling order for now; GUI still shows shortcut hints.
        const order: BeatType[] = [
          'scene-heading',
          'action',
          'character-cue',
          'dialogue',
          'parenthetical',
          'transition',
          'choice-point',
          'set-variable',
        ]
        const idx = order.indexOf(type)
        const next = order[(idx + 1) % order.length]
        onChange(next)
      }}
    >
      <span>{beatLabels[type]}</span>
      {beatShortcutLabels[type] && (
        <span className="text-[10px] text-[rgb(var(--text-muted))]">
          {beatShortcutLabels[type]}
        </span>
      )}
    </button>
  )
}

