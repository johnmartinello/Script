/**
 * Computes display numbers for scenes from the project graph.
 * Main path: 1, 2, 3, ... (from chapters or scenes order).
 * Branch scenes: N.a, N.b, ... where N is the main-path number of the source.
 */

import type { Project, GraphEdge } from './model'

export function computeSceneNumbers(project: Project): Record<string, string> {
  const sceneById = new Map(project.scenes.map((s) => [s.id, s]))
  const edgesBySource = new Map<string, GraphEdge[]>()
  for (const e of project.edges) {
    const list = edgesBySource.get(e.sourceSceneId) ?? []
    list.push(e)
    edgesBySource.set(e.sourceSceneId, list)
  }

  // Main path: chapter order or scenes array order
  let mainPathIds: string[]
  if (project.chapters.length > 0) {
    mainPathIds = project.chapters.flatMap((ch) => ch.sceneIds)
  } else {
    mainPathIds = project.scenes.map((s) => s.id)
  }
  mainPathIds = [...new Set(mainPathIds)].filter((id) => sceneById.has(id))

  const numbers: Record<string, string> = {}
  mainPathIds.forEach((id, i) => {
    numbers[id] = String(i + 1)
  })

  // Branch scenes: for each main-path scene, outgoing edges.
  for (let i = 0; i < mainPathIds.length; i++) {
    const sourceId = mainPathIds[i]
    const n = String(i + 1)
    const outgoing = edgesBySource.get(sourceId) ?? []
    const branchEdges = [...outgoing].sort((a, b) =>
      (a.label || a.id).localeCompare(b.label || b.id)
    )
    branchEdges.forEach((e, idx) => {
      const targetId = e.targetSceneId
      if (sceneById.has(targetId) && numbers[targetId] == null) {
        const letter = String.fromCharCode(97 + idx)
        numbers[targetId] = `${n}.${letter}`
      }
    })
  }

  // Fallback for any scene still unnumbered
  for (const s of project.scenes) {
    if (numbers[s.id] == null) {
      numbers[s.id] = '?'
    }
  }

  return numbers
}

/** Returns a new project with each scene's displayNumber set from the graph. */
export function withRecomputedSceneNumbers(project: Project): Project {
  const numbers = computeSceneNumbers(project)
  return {
    ...project,
    scenes: project.scenes.map((s) => ({
      ...s,
      displayNumber: numbers[s.id] ?? null,
    })),
  }
}
