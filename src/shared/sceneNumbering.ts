/**
 * Computes display numbers from scene metadata.
 * Canon scenes: 1, 2, 3...
 * Branch scenes: N.1, N.2... grouped by preceding canon and sorted by creation order.
 * Unattached branches: ?.1, ?.2...
 */

import type { Project, Scene } from './model'

export function computeSceneNumbers(project: Project): Record<string, string> {
  const sceneById = new Map(project.scenes.map((s) => [s.id, s]))
  const canonById = new Map(
    project.scenes.filter((s) => s.sceneKind === 'canon').map((s) => [s.id, s])
  )
  const numbers: Record<string, string> = {}

  // Canon path: chapter order or scene array order, canon scenes only.
  let canonSceneIds: string[]
  if (project.chapters.length > 0) {
    canonSceneIds = project.chapters.flatMap((ch) => ch.sceneIds)
  } else {
    canonSceneIds = project.scenes.map((s) => s.id)
  }

  const canonOrdered = [...new Set(canonSceneIds)].filter((id) => canonById.has(id))
  // Ensure canon scenes not in chapters still get a deterministic number.
  const remainingCanon = project.scenes
    .filter((s) => s.sceneKind === 'canon')
    .map((s) => s.id)
    .filter((id) => !canonOrdered.includes(id))
  const allCanonOrdered = [...canonOrdered, ...remainingCanon]

  allCanonOrdered.forEach((id, i) => {
    numbers[id] = String(i + 1)
  })

  const branches = project.scenes.filter((s) => s.sceneKind === 'branch')
  const byPreceding = new Map<string, Scene[]>()
  const unattached: Scene[] = []

  for (const branch of branches) {
    const precedingId = branch.branchMeta?.precedingCanonSceneId
    if (precedingId && canonById.has(precedingId)) {
      const list = byPreceding.get(precedingId) ?? []
      list.push(branch)
      byPreceding.set(precedingId, list)
    } else {
      unattached.push(branch)
    }
  }

  const sortByCreationOrder = (a: Scene, b: Scene) => {
    const ao = a.branchMeta?.branchOrder ?? Number.MAX_SAFE_INTEGER
    const bo = b.branchMeta?.branchOrder ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return a.id.localeCompare(b.id)
  }

  for (const canonId of allCanonOrdered) {
    const canonNumber = numbers[canonId]
    const list = (byPreceding.get(canonId) ?? []).sort(sortByCreationOrder)
    list.forEach((branch, idx) => {
      numbers[branch.id] = `${canonNumber}.${idx + 1}`
    })
  }

  unattached.sort(sortByCreationOrder).forEach((branch, idx) => {
    numbers[branch.id] = `?.${idx + 1}`
  })

  for (const scene of project.scenes) {
    if (numbers[scene.id] == null) {
      numbers[scene.id] = sceneById.has(scene.id) ? '?' : ''
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
