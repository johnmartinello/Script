import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'

export type SceneNodeData = {
  sceneId: string
  title: string
  selected?: boolean
}

export function SceneNode({ data, selected }: NodeProps<Node<SceneNodeData, 'scene'>>) {
  const d = data ?? { sceneId: '', title: 'Untitled' }
  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 min-w-[120px] max-w-[200px] bg-[rgb(var(--bg))] ${
        selected
          ? 'border-[rgb(var(--accent))] shadow-md'
          : 'border-[rgb(var(--border))] hover:border-[rgb(var(--text-muted))]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[rgb(var(--accent))]" />
      <div className="text-sm font-medium truncate" title={d.title}>
        {d.title || 'Untitled'}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[rgb(var(--accent))]" />
    </div>
  )
}
