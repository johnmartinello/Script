import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'

export type SceneNodeData = {
  sceneId: string
  title: string
  displayNumber?: string | null
  sceneKind: 'canon' | 'branch'
  unattached?: boolean
  selected?: boolean
}

export function SceneNode({ data, selected }: NodeProps<Node<SceneNodeData, 'scene'>>) {
  const d = data ?? { sceneId: '', title: 'Untitled', sceneKind: 'canon' as const }
  const branchClass =
    d.sceneKind === 'branch'
      ? 'bg-[rgb(var(--bg-muted))] border-dashed'
      : 'bg-[rgb(var(--bg))]'
  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 min-w-[120px] max-w-[200px] ${branchClass} ${
        selected
          ? 'border-[rgb(var(--accent))] shadow-md'
          : 'border-[rgb(var(--border))] hover:border-[rgb(var(--text-muted))]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[rgb(var(--accent))]" />
      {d.displayNumber && (
        <div className="text-[10px] text-[rgb(var(--text-muted))] mb-0.5">{d.displayNumber}</div>
      )}
      <div className="text-[10px] text-[rgb(var(--text-muted))] mb-0.5">
        {d.sceneKind === 'branch' ? 'BRANCH' : 'CANON'}
        {d.unattached ? ' • UNATTACHED' : ''}
      </div>
      <div className="text-sm font-medium truncate" title={d.title}>
        {d.title || 'Untitled'}
      </div>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[rgb(var(--accent))]" />
    </div>
  )
}
