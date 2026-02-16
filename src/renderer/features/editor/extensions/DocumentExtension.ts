import { Node } from '@tiptap/core'

/** Document that only contains beat blocks. */
export const Doc = Node.create({
  name: 'doc',
  topNode: true,
  content: 'beat+',
})
