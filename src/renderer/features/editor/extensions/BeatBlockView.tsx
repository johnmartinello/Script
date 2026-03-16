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
  const { node, updateAttributes, editor, getPos } = props
  const type = (node.attrs.beatType ?? 'scene-heading') as BeatType
  const activeBeatId = useProjectStore((s) => s.activeBeatId)
  const beatTipVisible = useProjectStore((s) => s.beatTipVisible)
  const beatId = (node.attrs.beatId ?? '') as string
  const isActiveBeat = activeBeatId === beatId

  let hasDifferentPreviousType = true
  try {
    const pos = typeof getPos === 'function' ? getPos() : null
    if (pos != null) {
      const $pos = editor.state.doc.resolve(pos)
      const index = $pos.index()
      if (index > 0) {
        const prev = $pos.node(-1).child(index - 1)
        if (prev && prev.type.name === 'beat') {
          const prevType = (prev.attrs.beatType ?? 'scene-heading') as BeatType
          hasDifferentPreviousType = prevType !== type
        }
      }
    }
  } catch {
    hasDifferentPreviousType = true
  }

  const showBeatTip = isActiveBeat && beatTipVisible && hasDifferentPreviousType

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
        <BeatTypeDropdown type={type} showTip={showBeatTip} onChange={(next) => {
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
  showTip,
  onChange,
}: {
  type: BeatType
  showTip: boolean
  onChange: (next: BeatType) => void
}) {
  if (!showTip) {
    return <div className="shrink-0 w-24" contentEditable={false} aria-hidden="true" />
  }

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

