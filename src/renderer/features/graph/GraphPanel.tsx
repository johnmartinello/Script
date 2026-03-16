import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeChange,
  type NodeTypes,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useProjectStore } from '@/renderer/store/projectStore'
import type { Scene } from '@/shared/model'
import { SceneNode, type SceneNodeData } from './SceneNode'
import { useSyncGraphToStore } from './useSyncGraphToStore'
import { deriveSceneFlowEdges, isUnattachedBranch } from './graphMapping'

const nodeTypes: NodeTypes = {
  scene: SceneNode,
}

function sceneToNode(
  s: Scene,
  pos: { x: number; y: number },
  selectedSceneId: string | null
): Node<SceneNodeData, 'scene'> {
  const unattached = isUnattachedBranch(s)
  return {
    id: s.id,
    type: 'scene',
    position: pos,
    data: {
      sceneId: s.id,
      title: s.title,
      displayNumber: s.displayNumber ?? undefined,
      sceneKind: s.sceneKind,
      unattached,
      selected: selectedSceneId === s.id,
    },
  }
}

function projectToNodesAndEdges(): {
  nodes: Node<SceneNodeData, 'scene'>[]
  edges: Edge[]
} {
  const state = useProjectStore.getState()
  const project = state.project
  if (!project) return { nodes: [], edges: [] }
  const { scenes, nodePositions } = project
  const selectedSceneId = state.selectedSceneId
  const nodes = scenes.map((s) => {
    const pos = nodePositions[s.id] ?? { x: 0, y: 0 }
    return sceneToNode(s, pos, selectedSceneId)
  })
  const flowEdges: Edge[] = deriveSceneFlowEdges(project)
  return { nodes, edges: flowEdges }
}

export function GraphPanel() {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(projectToNodesAndEdges, [])
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SceneNodeData, 'scene'>>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useSyncGraphToStore(nodes, setNodes, setEdges)

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      try {
        useProjectStore.getState().addEdgeFromConnection(connection.source, connection.target)
      } catch {
        // Invalid connections are ignored; derived scene flow remains authoritative.
      }
    },
    []
  )

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    const store = useProjectStore.getState()
    store.setSelectedSceneId(node.id)
    store.setViewMode('split')
  }, [])

  const addScene = useCallback(() => {
    const scene = useProjectStore.getState().addScene()
    const pos = useProjectStore.getState().project?.nodePositions[scene.id]
    setNodes((nds) => [...nds, sceneToNode(scene, pos ?? { x: 100, y: 100 }, null)])
  }, [setNodes])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[rgb(var(--bg-muted))]"
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <button
            type="button"
            onClick={addScene}
            className="px-3 py-1.5 text-sm rounded border border-border bg-[rgb(var(--bg))] hover:bg-[rgb(var(--border))]"
          >
            + New scene
          </button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
