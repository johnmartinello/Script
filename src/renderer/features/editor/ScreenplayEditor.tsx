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
  sceneId: string
  beats: Beat[]
  onBeatsChange: (beats: Beat[]) => void
}

export function ScreenplayEditor({ sceneId, beats, onBeatsChange }: ScreenplayEditorProps) {
  const updatingFromStore = useRef(false)
  const lastSceneId = useRef<string | null>(null)
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

  // Sync active beat when editor first mounts so the first beat shows the shortcut without user interaction
  useEffect(() => {
    if (!editor) return
    syncActiveBeatFromSelection(editor, setActiveBeatType, setActiveBeatId)
  }, [editor, setActiveBeatType, setActiveBeatId])

  useEffect(() => {
    if (!editor) return
    if (lastSceneId.current !== sceneId) {
      lastSceneId.current = sceneId
      updatingFromStore.current = true
      editor.commands.setContent(beatsToTiptapJson(beats))
      updatingFromStore.current = false
      syncActiveBeatFromSelection(editor, setActiveBeatType, setActiveBeatId)
      return
    }
    const current = tiptapJsonToBeats(getDocContent(editor) as Parameters<typeof tiptapJsonToBeats>[0])
    const same =
      current.length === beats.length &&
      current.every((c, i) => {
        const b = beats[i]
        if (!b) return false
        if (c.type !== b.type || c.id !== b.id) return false
        if ('text' in c && 'text' in b) return c.text === b.text
        if (c.type === 'choice-point' && b.type === 'choice-point') {
          return (
            c.options.length === b.options.length &&
            c.options.every((o, j) => o.id === b.options[j]?.id && o.label === b.options[j]?.label)
          )
        }
        return true
      })
    if (same) return
    updatingFromStore.current = true
    editor.commands.setContent(beatsToTiptapJson(beats))
    updatingFromStore.current = false
    syncActiveBeatFromSelection(editor, setActiveBeatType, setActiveBeatId)
  }, [sceneId, beats, editor, setActiveBeatType, setActiveBeatId])

  if (!editor) return <div className="p-4 text-[rgb(var(--text-muted))]">Loading editor…</div>

  return (
    <div className="screenplay-page">
      <EditorContent editor={editor} />
    </div>
  )
}
