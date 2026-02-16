import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { BeatBlockView } from './BeatBlockView'
import type { BeatType } from '@/shared/model'

export interface BeatOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    beat: {
      setBeatType: (type: BeatType) => ReturnType
      setBeatId: (id: string) => ReturnType
    }
  }
}

export const BeatBlock = Node.create<BeatOptions>({
  name: 'beat',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      beatType: {
        default: 'scene-heading',
        parseHTML: (el) => (el.getAttribute('data-beat-type') as BeatType) || 'scene-heading',
        renderHTML: (attrs) => ({ 'data-beat-type': attrs.beatType }),
      },
      beatId: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-beat-id') ?? '',
        renderHTML: (attrs) => ({ 'data-beat-id': attrs.beatId }),
      },
      options: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-options')
          if (!raw) return null
          try {
            return JSON.parse(raw)
          } catch {
            return null
          }
        },
        renderHTML: (attrs) => {
          if (!attrs.options) return {}
          return { 'data-options': JSON.stringify(attrs.options) }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-beat]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, { 'data-beat': '' }, HTMLAttributes),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(BeatBlockView)
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const $pos = selection.$anchor
        const node = $pos.parent
        if (node.type.name !== 'beat') return false
        const beatType = (node.attrs.beatType ?? 'scene-heading') as BeatType
        const nextType = nextBeatType(beatType)
        const pos = $pos.after()
        const beatId = crypto.randomUUID()
        const content =
          nextType === 'choice-point'
            ? { type: 'beat', attrs: { beatType: nextType, beatId, options: [] }, content: [] }
            : { type: 'beat', attrs: { beatType: nextType, beatId, options: null }, content: [] }
        editor.chain().insertContentAt(pos, content).focus(pos + 1).run()
        return true
      },
      'Mod-1': ({ editor }) => setCurrentBeatType(editor, 'scene-heading'),
      'Mod-2': ({ editor }) => setCurrentBeatType(editor, 'action'),
      'Mod-3': ({ editor }) => setCurrentBeatType(editor, 'character-cue'),
      'Mod-4': ({ editor }) => setCurrentBeatType(editor, 'dialogue'),
      'Mod-5': ({ editor }) => setCurrentBeatType(editor, 'parenthetical'),
      'Mod-6': ({ editor }) => setCurrentBeatType(editor, 'transition'),
      'Mod-7': ({ editor }) => setCurrentBeatType(editor, 'choice-point'),
    }
  },
})

function nextBeatType(current: BeatType): BeatType {
  switch (current) {
    case 'scene-heading':
      return 'action'
    case 'action':
      return 'action'
    case 'character-cue':
      return 'dialogue'
    case 'dialogue':
      return 'action'
    case 'parenthetical':
      return 'dialogue'
    case 'transition':
      return 'scene-heading'
    case 'choice-point':
      return 'action'
    case 'set-variable':
      return 'action'
    default:
      return 'action'
  }
}

function setCurrentBeatType(editor: import('@tiptap/core').Editor, type: BeatType): boolean {
  const { state, view } = editor
  const { selection } = state
  const $pos = selection.$anchor
  const node = $pos.parent
  if (node.type.name !== 'beat') return false
  const attrs = node.attrs ?? {}
  const nextAttrs: Record<string, unknown> = {
    ...attrs,
    beatType: type,
  }
  if (type === 'choice-point' && !Array.isArray(attrs.options)) {
    nextAttrs.options = []
  }
  if (type !== 'choice-point') {
    nextAttrs.options = null
  }
  const tr = state.tr.setNodeMarkup($pos.before(), undefined, nextAttrs)
  view.dispatch(tr)
  return true
}

