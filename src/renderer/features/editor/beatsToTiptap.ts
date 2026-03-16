import type { Beat, BeatType } from '@/shared/model'

export interface TipTapBeatNode {
  type: 'beat'
  attrs: { beatType: BeatType; beatId: string }
  content?: { type: 'text'; text: string }[]
}

export function beatsToTiptapJson(beats: Beat[]): { type: 'doc'; content: TipTapBeatNode[] } {
  const list = beats.length ? beats : [{ id: crypto.randomUUID(), type: 'scene-heading' as const, text: '' }]
  const content: TipTapBeatNode[] = list.map((b) => {
    const text = 'text' in b ? (b as { text: string }).text : ''
    return {
      type: 'beat',
      attrs: { beatType: b.type, beatId: b.id },
      content: text ? [{ type: 'text', text }] : [],
    }
  })
  return {
    type: 'doc',
    content: content.length
      ? content
      : [{ type: 'beat', attrs: { beatType: 'scene-heading', beatId: crypto.randomUUID() }, content: [] }],
  }
}

export function tiptapJsonToBeats(doc: {
  content?: { attrs?: { beatType: BeatType; beatId: string }; content?: { text?: string }[] }[]
}): Beat[] {
  const content = doc.content ?? []
  return content.map((node) => {
    const rawType = node.attrs?.beatType
    const type: BeatType =
      rawType === 'scene-heading' ||
      rawType === 'action' ||
      rawType === 'character-cue' ||
      rawType === 'dialogue' ||
      rawType === 'parenthetical' ||
      rawType === 'transition' ||
      rawType === 'set-variable'
        ? rawType
        : 'action'
    const id = node.attrs?.beatId ?? crypto.randomUUID()
    const text = node.content?.map((c) => c.text ?? '').join('') ?? ''
    return { id, type, text } as Beat
  })
}
