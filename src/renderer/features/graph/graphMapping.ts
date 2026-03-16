import type { Edge } from '@xyflow/react'
import type { Project, Scene } from '@/shared/model'

function getCanonicalSceneOrder(project: Project): string[] {
  const canonIds = new Set(project.scenes.filter((s) => s.sceneKind === 'canon').map((s) => s.id))
  let ordered: string[] = []
  if (project.chapters.length > 0) {
    ordered = project.chapters.flatMap((ch) => ch.sceneIds).filter((id) => canonIds.has(id))
  } else {
    ordered = project.scenes.filter((s) => s.sceneKind === 'canon').map((s) => s.id)
  }
  const uniqueOrdered = [...new Set(ordered)]
  const missing = [...canonIds].filter((id) => !uniqueOrdered.includes(id))
  return [...uniqueOrdered, ...missing]
}

function buildFlowEdge(id: string, source: string, target: string, label?: string): Edge {
  return {
    id,
    source,
    target,
    label: label || undefined,
    type: 'smoothstep',
  }
}

export function deriveSceneFlowEdges(project: Project): Edge[] {
  const sceneById = new Map(project.scenes.map((s) => [s.id, s]))
  const canonicalOrder = getCanonicalSceneOrder(project)

  const edges: Edge[] = []
  const used = new Set<string>()
  const add = (edge: Edge) => {
    const key = `${edge.source}->${edge.target}`
    if (used.has(key)) return
    used.add(key)
    edges.push(edge)
  }

  // Linear canon chain.
  for (let i = 0; i < canonicalOrder.length - 1; i++) {
    const source = canonicalOrder[i]
    const target = canonicalOrder[i + 1]
    add(buildFlowEdge(`canon:${source}:${target}`, source, target))
  }

  // Branch insertions: preceding canon -> branch -> following canon.
  const branchScenes = project.scenes.filter((s) => s.sceneKind === 'branch')
  for (const branch of branchScenes) {
    const preceding = branch.branchMeta?.precedingCanonSceneId
    const following = branch.branchMeta?.followingCanonSceneId
    if (preceding && sceneById.has(preceding)) {
      add(
        buildFlowEdge(
          `branch-in:${preceding}:${branch.id}`,
          preceding,
          branch.id,
          branch.branchMeta?.conditionText ?? ''
        )
      )
    }
    if (following && sceneById.has(following)) {
      add(buildFlowEdge(`branch-out:${branch.id}:${following}`, branch.id, following))
    }
  }

  // Preserve user-created extra edges that are not already represented.
  for (const e of project.edges) {
    add(buildFlowEdge(e.id, e.sourceSceneId, e.targetSceneId, e.label))
  }

  return edges
}

export function isUnattachedBranch(scene: Scene): boolean {
  if (scene.sceneKind !== 'branch') return false
  return !scene.branchMeta?.precedingCanonSceneId || !scene.branchMeta?.followingCanonSceneId
}
