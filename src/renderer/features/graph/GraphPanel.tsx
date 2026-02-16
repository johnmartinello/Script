import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
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
import { SceneNode, type SceneNodeData } from './SceneNode'
import { useSyncGraphToStore } from './useSyncGraphToStore'

const nodeTypes: NodeTypes = {
  scene: SceneNode,
}

function sceneToNode(s: { id: string; title: string }, pos: { x: number; y: number }, selectedSceneId: string | null): Node<SceneNodeData, 'scene'> {
  return {
    id: s.id,
    type: 'scene',
    position: pos,
    data: {
      sceneId: s.id,
      title: s.title,
      selected: selectedSceneId === s.id,
    },
  }
}

function projectToNodesAndEdges(): {
  nodes: Node<SceneNodeData, 'scene'>[]
  edges: Edge[]
} {
  const state = useProjectStore.getState()
  const { scenes, edges, nodePositions } = state.project
  const selectedSceneId = state.selectedSceneId
  const nodes = scenes.map((s) => {
    const pos = nodePositions[s.id] ?? { x: 0, y: 0 }
    return sceneToNode(s, pos, selectedSceneId)
  })
  const flowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.sourceSceneId,
    target: e.targetSceneId,
    label: e.label || undefined,
    type: 'smoothstep',
  }))
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
      const edge = useProjectStore.getState().addEdgeFromConnection(
        connection.source,
        connection.target
      )
      setEdges((eds) => addEdge({ ...connection, id: edge.id }, eds))
    },
    [setEdges]
  )

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    useProjectStore.getState().setSelectedSceneId(node.id)
  }, [])

  const addScene = useCallback(() => {
    const scene = useProjectStore.getState().addScene()
    const pos = useProjectStore.getState().project.nodePositions[scene.id]
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
