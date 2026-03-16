import type { ReactNodeViewProps } from '@tiptap/react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useProjectStore } from '@/renderer/store/projectStore'
import type { BeatType } from '@/shared/model'

const beatLabels: Record<BeatType, string> = {
  'scene-heading': 'SCENE',
  action: 'Action',
  'character-cue': 'Character',
  dialogue: 'Dialogue',
  parenthetical: 'Parenthetical',
  transition: 'Transition',
  'set-variable': 'Set Variable',
}

const beatShortcutLabels: Partial<Record<BeatType, string>> = {
  'scene-heading': 'Ctrl+1',
  action: 'Ctrl+2',
  'character-cue': 'Ctrl+3',
  dialogue: 'Ctrl+4',
  parenthetical: 'Ctrl+5',
  transition: 'Ctrl+6',
}

export function BeatBlockView(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props
  const type = (node.attrs.beatType ?? 'scene-heading') as BeatType
  const activeBeatId = useProjectStore((s) => s.activeBeatId)
  const beatId = (node.attrs.beatId ?? '') as string
  const isActiveBeat = activeBeatId === beatId

  const contentClassName =
    type === 'scene-heading'
      ? 'font-bold uppercase text-sm text-[rgb(var(--text-muted))]'
      : type === 'character-cue'
        ? 'text-center font-semibold'
        : type === 'transition'
          ? 'text-right text-sm'
          : ''

  const contentWrapperClassName =
    type === 'character-cue'
      ? 'flex-1 min-w-0 flex justify-center'
      : type === 'dialogue'
        ? 'flex-1 min-w-0 pl-8'
        : type === 'parenthetical'
          ? 'flex-1 min-w-0 pl-12'
          : type === 'transition'
            ? 'flex-1 min-w-0 flex justify-end'
            : 'flex-1 min-w-0'

  return (
    <NodeViewWrapper as="div" data-beat="" data-beat-id={beatId} className="my-3">
      <div className="flex items-baseline gap-2">
        <BeatTypeDropdown type={type} showShortcut={isActiveBeat} onChange={(next) => {
          updateAttributes({ ...node.attrs, beatType: next })
        }} />
        <div className={contentWrapperClassName}>
          <NodeViewContent className={`min-w-0 ${contentClassName}`} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

function BeatTypeDropdown({
  type,
  showShortcut,
  onChange,
}: {
  type: BeatType
  showShortcut: boolean
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
          'set-variable',
        ]
        const idx = order.indexOf(type)
        const next = order[(idx + 1) % order.length]
        onChange(next)
      }}
    >
      <span>{beatLabels[type]}</span>
      {showShortcut && beatShortcutLabels[type] && (
        <span className="text-[10px] text-[rgb(var(--text-muted))]">
          {beatShortcutLabels[type]}
        </span>
      )}
    </button>
  )
}

