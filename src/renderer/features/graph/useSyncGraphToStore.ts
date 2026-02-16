import { useEffect, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { useProjectStore } from '@/renderer/store/projectStore'
import type { SceneNodeData } from './SceneNode'

type SetNodes = React.Dispatch<React.SetStateAction<Node<SceneNodeData, 'scene'>[]>>
type SetEdges = React.Dispatch<React.SetStateAction<Edge[]>>

export function useSyncGraphToStore(
  nodes: Node<SceneNodeData, 'scene'>[],
  setNodes: SetNodes,
  setEdges: SetEdges
) {
  const prevPositions = useRef<Record<string, { x: number; y: number }>>({})

  useEffect(() => {
    const project = useProjectStore.getState().project
    if (!project) return
    const positions: Record<string, { x: number; y: number }> = {}
    nodes.forEach((n) => {
      positions[n.id] = n.position
    })
    const storePositions = project.nodePositions
    const positionsChanged = nodes.some((n) => {
      const stored = storePositions[n.id]
      return !stored || stored.x !== n.position.x || stored.y !== n.position.y
    })
    if (positionsChanged) {
      prevPositions.current = positions
      useProjectStore.getState().setNodePositions(positions)
    }
  }, [nodes])

  useEffect(() => {
    const unsub = useProjectStore.subscribe(() => {
      const state = useProjectStore.getState()
      const project = state.project
      if (!project) return
      const { scenes, edges, nodePositions } = project
      const selectedSceneId = state.selectedSceneId
      const newNodes: Node<SceneNodeData, 'scene'>[] = scenes.map((s) => ({
        id: s.id,
        type: 'scene',
        position: nodePositions[s.id] ?? { x: 0, y: 0 },
        data: {
          sceneId: s.id,
          title: s.title,
          selected: selectedSceneId === s.id,
        },
      }))
      const newEdges: Edge[] = edges.map((e) => ({
        id: e.id,
        source: e.sourceSceneId,
        target: e.targetSceneId,
        label: e.label || undefined,
        type: 'smoothstep',
      }))
      setNodes(newNodes as Node<SceneNodeData, 'scene'>[])
      setEdges(newEdges)
    })
    return unsub
  }, [setNodes, setEdges])

}
