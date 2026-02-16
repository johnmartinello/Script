import type { Beat, BeatType, ChoiceOption } from '@/shared/model'

export interface TipTapBeatNode {
  type: 'beat'
  attrs: { beatType: BeatType; beatId: string; options: ChoiceOption[] | null }
  content?: { type: 'text'; text: string }[]
}

export function beatsToTiptapJson(beats: Beat[]): { type: 'doc'; content: TipTapBeatNode[] } {
  const list = beats.length ? beats : [{ id: crypto.randomUUID(), type: 'action' as const, text: '' }]
  const content: TipTapBeatNode[] = list.map((b) => {
    if (b.type === 'choice-point') {
      return {
        type: 'beat',
        attrs: { beatType: 'choice-point', beatId: b.id, options: b.options },
        content: [],
      }
    }
    const text = 'text' in b ? (b as { text: string }).text : ''
    return {
      type: 'beat',
      attrs: { beatType: b.type, beatId: b.id, options: null },
      content: text ? [{ type: 'text', text }] : [],
    }
  })
  return { type: 'doc', content: content.length ? content : [{ type: 'beat', attrs: { beatType: 'action', beatId: crypto.randomUUID(), options: null }, content: [] }] }
}

export function tiptapJsonToBeats(doc: { content?: { attrs?: { beatType: BeatType; beatId: string; options: unknown }; content?: { text?: string }[] }[] }): Beat[] {
  const content = doc.content ?? []
  return content.map((node) => {
    const type = (node.attrs?.beatType ?? 'action') as BeatType
    const id = node.attrs?.beatId ?? crypto.randomUUID()
    const text = node.content?.map((c) => c.text ?? '').join('') ?? ''
    if (type === 'choice-point') {
      const options = (node.attrs?.options as ChoiceOption[] | undefined) ?? []
      return { id, type: 'choice-point' as const, options }
    }
    return { id, type, text } as Beat
  })
}
