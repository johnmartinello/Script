import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { Doc } from './extensions/DocumentExtension'
import { BeatBlock } from './extensions/BeatExtension'
import Text from '@tiptap/extension-text'
import { useEffect, useRef } from 'react'
import type { Beat, BeatType } from '@/shared/model'
import { beatsToTiptapJson, tiptapJsonToBeats } from './beatsToTiptap'
import { useProjectStore } from '@/renderer/store/projectStore'

const extensions = [Doc, Text, BeatBlock]

function getDocContent(editor: Editor): { content?: unknown[] } {
  try {
    return editor.getJSON()
  } catch {
    return {}
  }
}

function syncActiveBeatFromSelection(
  editor: Editor,
  setActiveBeatType: (t: BeatType | null) => void,
  setActiveBeatId: (id: string | null) => void
) {
  try {
    const { state } = editor
    const { selection } = state
    const $pos = selection.$from
    const node = $pos.parent
    if (node.type.name === 'beat') {
      const beatType = (node.attrs.beatType ?? 'scene-heading') as BeatType
      const beatId = (node.attrs.beatId ?? '') as string
      setActiveBeatType(beatType)
      setActiveBeatId(beatId)
    } else {
      setActiveBeatType(null)
      setActiveBeatId(null)
    }
  } catch {
    setActiveBeatType(null)
    setActiveBeatId(null)
  }
}

interface ScreenplayEditorProps {
  beats: Beat[]
  onBeatsChange: (beats: Beat[]) => void
}

function beatsEqual(a: Beat[], b: Beat[]): boolean {
  if (a.length !== b.length) return false
  return a.every((c, i) => {
    const beat = b[i]
    if (!beat) return false
    if (c.type !== beat.type || c.id !== beat.id) return false
    if ('text' in c && 'text' in beat) return c.text === beat.text
    if (c.type === 'choice-point' && beat.type === 'choice-point') {
      return (
        c.options.length === beat.options.length &&
        c.options.every((o, j) => o.id === beat.options[j]?.id && o.label === beat.options[j]?.label)
      )
    }
    return true
  })
}

export function ScreenplayEditor({ beats, onBeatsChange }: ScreenplayEditorProps) {
  const updatingFromStore = useRef(false)
  const setActiveBeatType = useProjectStore((s) => s.setActiveBeatType)
  const setActiveBeatId = useProjectStore((s) => s.setActiveBeatId)

  const editor = useEditor({
    extensions,
    content: beatsToTiptapJson(beats),
    editorProps: {
      attributes: {
        class: 'screenplay-editor min-h-full h-full focus:outline-none',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          return false
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      if (updatingFromStore.current) return
      const doc = getDocContent(editor) as Parameters<typeof tiptapJsonToBeats>[0]
      const next = tiptapJsonToBeats(doc)
      onBeatsChange(next)
      syncActiveBeatFromSelection(editor, setActiveBeatType, setActiveBeatId)
    },
    onSelectionUpdate: ({ editor }) => {
      syncActiveBeatFromSelection(editor, setActiveBeatType, setActiveBeatId)
    },
  })

  useEffect(() => {
    if (!editor) return
    syncActiveBeatFromSelection(editor, setActiveBeatType, setActiveBeatId)
  }, [editor, setActiveBeatType, setActiveBeatId])

  useEffect(() => {
    if (!editor) return
    const current = tiptapJsonToBeats(getDocContent(editor) as Parameters<typeof tiptapJsonToBeats>[0])
    if (beatsEqual(current, beats)) return
    updatingFromStore.current = true
    editor.commands.setContent(beatsToTiptapJson(beats))
    updatingFromStore.current = false
    syncActiveBeatFromSelection(editor, setActiveBeatType, setActiveBeatId)
  }, [beats, editor, setActiveBeatType, setActiveBeatId])

  if (!editor) return <div className="p-4 text-[rgb(var(--text-muted))]">Loading editor…</div>

  return (
    <div className="screenplay-page">
      <EditorContent editor={editor} />
    </div>
  )
}
