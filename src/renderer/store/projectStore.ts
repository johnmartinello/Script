import { create } from 'zustand'
import type {
  Project,
  Scene,
  Beat,
  GraphEdge,
  GraphNodePosition,
  BranchMeta,
} from '@/shared/model'
import {
  createEmptyProject,
  createScene,
  createGraphEdge,
  newBeatId,
} from '@/shared/model'
import { withRecomputedSceneNumbers } from '@/shared/sceneNumbering'

export type ViewMode = 'editor' | 'graph' | 'split' | 'help'

interface ProjectState {
  /** null when no project is loaded (start screen). */
  project: Project | null
  selectedSceneId: string | null
  viewMode: ViewMode
  /** Path to current .gscript file when loaded/saved. */
  projectFilePath: string | null
  /** Dirty flag for autosave. */
  dirty: boolean
  /** Whether the reference sidebar is visible. */
  referenceSidebarOpen: boolean
  /** Beat type at the current editor selection (for context-aware help). */
  activeBeatType: Beat['type'] | null
  /** Beat id at the current editor selection (e.g. to show shortcut only on active beat). */
  activeBeatId: string | null
}

interface ProjectActions {
  setProject: (project: Project | null) => void
  updateProject: (patch: Partial<Pick<Project, 'name'>>) => void
  setProjectFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  setSelectedSceneId: (id: string | null) => void
  setViewMode: (mode: ViewMode) => void
  toggleReferenceSidebar: () => void
  setActiveBeatType: (type: Beat['type'] | null) => void
  setActiveBeatId: (id: string | null) => void

  addScene: (title?: string) => Scene
  addBranchScene: (params: {
    title?: string
    precedingCanonSceneId: string
    followingCanonSceneId: string
    conditionText: string
  }) => Scene
  updateScene: (
    sceneId: string,
    patch: Partial<Pick<Scene, 'title' | 'chapterId' | 'sourceBeatId' | 'branchMeta' | 'sceneKind'>>
  ) => void
  deleteScene: (sceneId: string) => void
  getScene: (sceneId: string) => Scene | undefined
  getCanonicalScenes: () => Scene[]
  getBranchScenes: () => Scene[]
  isSceneUnattached: (sceneId: string) => boolean
  /** Scene id that contains the beat with the given id (for universal document view). */
  getSceneIdByBeatId: (beatId: string) => string | undefined
  /** All beats from canon scenes concatenated in document order (for main editor). */
  getAllBeatsFlat: () => Beat[]
  /** Create/update scenes from scene-heading beats in document order. First heading = owner scene; rest create or update by sourceBeatId. */
  syncScenesFromHeadings: (ownerSceneId: string, beats: Beat[]) => void
  /** Sync flat document beats back to scenes: split by scene-heading, match/create/delete scenes. */
  syncDocumentToScenes: (allBeats: Beat[]) => void

  setBeats: (sceneId: string, beats: Beat[]) => void
  addBeat: (sceneId: string, beat: Beat, index?: number) => void
  updateBeat: (sceneId: string, beatId: string, patch: Partial<Beat>) => void
  removeBeat: (sceneId: string, beatId: string) => void
  reorderBeats: (sceneId: string, fromIndex: number, toIndex: number) => void

  addEdge: (edge: GraphEdge) => void
  /** Create an edge from source scene to target scene. */
  addEdgeFromConnection: (sourceSceneId: string, targetSceneId: string) => GraphEdge
  updateEdge: (edgeId: string, patch: Partial<GraphEdge>) => void
  removeEdge: (edgeId: string) => void
  setNodePosition: (sceneId: string, position: GraphNodePosition) => void
  setNodePositions: (positions: Record<string, GraphNodePosition>) => void

  newProject: () => void
}

function getScene(state: ProjectState, sceneId: string): Scene | undefined {
  if (!state.project) return undefined
  return state.project.scenes.find((s) => s.id === sceneId)
}

function getCanonicalScenes(state: ProjectState): Scene[] {
  if (!state.project) return []
  return state.project.scenes.filter((s) => s.sceneKind === 'canon')
}

function getBranchScenes(state: ProjectState): Scene[] {
  if (!state.project) return []
  return state.project.scenes.filter((s) => s.sceneKind === 'branch')
}

function isSceneUnattached(state: ProjectState, sceneId: string): boolean {
  const scene = getScene(state, sceneId)
  if (!scene || scene.sceneKind !== 'branch') return false
  const meta = scene.branchMeta
  if (!meta) return true
  const precedingExists = !!meta.precedingCanonSceneId && !!getScene(state, meta.precedingCanonSceneId)
  const followingExists = !!meta.followingCanonSceneId && !!getScene(state, meta.followingCanonSceneId)
  return !precedingExists || !followingExists
}

function replaceScene(
  state: ProjectState,
  sceneId: string,
  updater: (s: Scene) => Scene
): Project | null {
  if (!state.project) return null
  return {
    ...state.project,
    scenes: state.project.scenes.map((s) => (s.id === sceneId ? updater(s) : s)),
  }
}

function applySceneNumbers(project: Project | null): Project | null {
  return project ? withRecomputedSceneNumbers(project) : null
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  project: null,
  selectedSceneId: null,
  viewMode: 'editor',
  projectFilePath: null,
  dirty: false,
  referenceSidebarOpen: false,
  activeBeatType: null,
  activeBeatId: null,

  setProject: (project) => set({ project: applySceneNumbers(project), dirty: false }),
  updateProject: (patch) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: { ...state.project, ...patch },
        dirty: true,
      }
    }),
  setProjectFilePath: (path) => set({ projectFilePath: path }),
  setDirty: (dirty) => set({ dirty }),
  setSelectedSceneId: (id) => set({ selectedSceneId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleReferenceSidebar: () =>
    set((state) => ({ referenceSidebarOpen: !state.referenceSidebarOpen })),
  setActiveBeatType: (type) => set({ activeBeatType: type }),
  setActiveBeatId: (id) => set({ activeBeatId: id }),

  addScene: (title) => {
    const headingBeatId = newBeatId()
    const headingText = title?.trim() || 'Untitled Scene'
    const scene: Scene = {
      ...createScene(headingText),
      beats: [{ id: headingBeatId, type: 'scene-heading', text: headingText }],
      sourceBeatId: headingBeatId,
    }
    set((state) => {
      if (!state.project) return state
      const next = {
        ...state.project,
        scenes: [...state.project.scenes, scene],
        nodePositions: {
          ...state.project.nodePositions,
          [scene.id]: { x: 100 + state.project!.scenes.length * 180, y: 100 },
        },
      }
      return {
        project: applySceneNumbers(next),
        selectedSceneId: scene.id,
        viewMode: 'editor',
        dirty: true,
      }
    })
    return scene
  },

  addBranchScene: ({ title, precedingCanonSceneId, followingCanonSceneId, conditionText }) => {
    const headingBeatId = newBeatId()
    const headingText = title?.trim() || 'Untitled Branch Scene'
    const state = get()
    const project = state.project
    if (!project) throw new Error('No project loaded')

    const branchOrder =
      project.scenes
        .filter(
          (s) =>
            s.sceneKind === 'branch' &&
            s.branchMeta?.precedingCanonSceneId === precedingCanonSceneId
        )
        .reduce((max, s) => Math.max(max, s.branchMeta?.branchOrder ?? 0), 0) + 1

    const scene: Scene = {
      ...createScene(headingText),
      sceneKind: 'branch',
      branchMeta: {
        precedingCanonSceneId,
        followingCanonSceneId,
        conditionText: conditionText.trim(),
        branchOrder,
      },
      beats: [{ id: headingBeatId, type: 'scene-heading', text: headingText }],
      sourceBeatId: headingBeatId,
    }

    set((currentState) => {
      if (!currentState.project) return currentState
      const next = {
        ...currentState.project,
        scenes: [...currentState.project.scenes, scene],
        nodePositions: {
          ...currentState.project.nodePositions,
          [scene.id]: { x: 120 + currentState.project.scenes.length * 120, y: 220 },
        },
      }
      return {
        project: applySceneNumbers(next),
        selectedSceneId: scene.id,
        viewMode: 'editor',
        dirty: true,
      }
    })
    return scene
  },

  updateScene: (sceneId, patch) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const next = replaceScene(state, sceneId, (s) => ({ ...s, ...patch }))
      if (!next) return state
      return { project: applySceneNumbers(next), dirty: true }
    })
  },

  deleteScene: (sceneId) => {
    set((state) => {
      if (!state.project) return state
      const deleted = state.project.scenes.find((s) => s.id === sceneId)
      const nextScenes = state.project.scenes
        .filter((s) => s.id !== sceneId)
        .map((s) => {
          if (!deleted || deleted.sceneKind !== 'canon' || s.sceneKind !== 'branch' || !s.branchMeta) {
            return s
          }
          const precedingCanonSceneId =
            s.branchMeta.precedingCanonSceneId === sceneId ? null : s.branchMeta.precedingCanonSceneId
          const followingCanonSceneId =
            s.branchMeta.followingCanonSceneId === sceneId ? null : s.branchMeta.followingCanonSceneId
          return {
            ...s,
            branchMeta: {
              ...s.branchMeta,
              precedingCanonSceneId,
              followingCanonSceneId,
            },
          }
        })
      const next = {
        ...state.project,
        scenes: nextScenes,
        edges: state.project.edges.filter(
          (e) => e.sourceSceneId !== sceneId && e.targetSceneId !== sceneId
        ),
        nodePositions: Object.fromEntries(
          Object.entries(state.project.nodePositions).filter(([id]) => id !== sceneId)
        ),
      }
      return {
        project: applySceneNumbers(next),
        selectedSceneId: state.selectedSceneId === sceneId ? null : state.selectedSceneId,
        dirty: true,
      }
    })
  },

  getScene: (sceneId) => getScene(get(), sceneId),
  getCanonicalScenes: () => getCanonicalScenes(get()),
  getBranchScenes: () => getBranchScenes(get()),
  isSceneUnattached: (sceneId) => isSceneUnattached(get(), sceneId),

  getSceneIdByBeatId: (beatId) => {
    const state = get()
    if (!state.project) return undefined
    return state.project.scenes.find((s) => s.beats.some((b) => b.id === beatId))?.id
  },

  getAllBeatsFlat: () => {
    const state = get()
    if (!state.project) return []
    return getCanonicalScenes(state).flatMap((s) => s.beats)
  },

  syncScenesFromHeadings: (ownerSceneId, beats) => {
    const headings = beats
      .filter((b): b is Beat & { type: 'scene-heading'; text: string } => b.type === 'scene-heading')
      .map((b) => ({ beatId: b.id, text: b.text?.trim() || 'Untitled Scene' }))
    if (headings.length === 0) return
    const store = get()
    if (!store.project) return
    store.updateScene(ownerSceneId, { title: headings[0].text, sourceBeatId: headings[0].beatId })
    for (let i = 1; i < headings.length; i++) {
      const { beatId, text } = headings[i]
      const project = get().project
      const existing = project?.scenes.find((s) => s.sceneKind === 'canon' && s.sourceBeatId === beatId)
      if (existing) {
        get().updateScene(existing.id, { title: text })
      } else {
        const scene = get().addScene(text)
        get().updateScene(scene.id, { sourceBeatId: beatId })
      }
    }
  },

  syncDocumentToScenes: (allBeats) => {
    set((state) => {
      if (!state.project) return state
      const canonScenes = state.project.scenes.filter((s) => s.sceneKind === 'canon')
      const branchScenes = state.project.scenes.filter((s) => s.sceneKind === 'branch')
      if (canonScenes.length === 0) return state

      const headings = allBeats
        .filter((b): b is Beat & { type: 'scene-heading'; text: string } => b.type === 'scene-heading')
      if (headings.length === 0) {
        const first = canonScenes[0]
        if (!first) return state
        const beats = allBeats.length
          ? allBeats
          : [{ id: newBeatId(), type: 'scene-heading' as const, text: '' }]
        const firstHeading = beats.find((b) => b.type === 'scene-heading')
        const nextCanonScenes = [
          {
            ...first,
            beats,
            title: 'Untitled Scene',
            sourceBeatId: firstHeading?.id ?? null,
          },
          ...canonScenes.slice(1),
        ]
        const nextProject = {
          ...state.project,
          scenes: [...nextCanonScenes, ...branchScenes],
        }
        return { project: applySceneNumbers(nextProject), dirty: true }
      }

      const headingBeatIds = new Set(headings.map((h) => h.id))
      const headingIndices = allBeats
        .map((b, i) => (b.type === 'scene-heading' ? i : -1))
        .filter((i) => i >= 0)
      const groups: { headingBeatId: string; title: string; beats: Beat[] }[] = headingIndices.map(
        (startIdx, k) => {
          const endIdx = headingIndices[k + 1] ?? allBeats.length
          const headingBeat = allBeats[startIdx] as Beat & { type: 'scene-heading'; text: string }
          const beats = k === 0 ? allBeats.slice(0, endIdx) : allBeats.slice(startIdx, endIdx)
          return {
            headingBeatId: headingBeat.id,
            title: headingBeat.text?.trim() || 'Untitled Scene',
            beats,
          }
        }
      )
      const existingBySourceBeatId = new Map<string, Scene>()
      canonScenes.forEach((s) => {
        if (s.sourceBeatId) existingBySourceBeatId.set(s.sourceBeatId, s)
      })
      const nextCanonScenes: Scene[] = []
      for (const g of groups) {
        const existing = existingBySourceBeatId.get(g.headingBeatId)
        const stillExists = existing && headingBeatIds.has(g.headingBeatId)
        if (existing && stillExists) {
          nextCanonScenes.push({
            ...existing,
            sceneKind: 'canon',
            branchMeta: null,
            title: g.title,
            beats: g.beats,
            sourceBeatId: g.headingBeatId,
          })
        } else {
          const scene = createScene(g.title)
          nextCanonScenes.push({
            ...scene,
            sceneKind: 'canon',
            branchMeta: null,
            beats: g.beats,
            sourceBeatId: g.headingBeatId,
          })
        }
      }
      const nextScenes = [...nextCanonScenes, ...branchScenes]
      const keepIds = new Set(nextScenes.map((s) => s.id))
      const prevSceneIds = new Set(canonScenes.map((s) => s.id))
      const createdSceneIds = new Set(
        nextCanonScenes.filter((s) => !prevSceneIds.has(s.id)).map((s) => s.id)
      )
      const removeCanonIds = canonScenes.filter((s) => !nextCanonScenes.some((n) => n.id === s.id)).map((s) => s.id)
      const nextNodePositions = { ...state.project.nodePositions }
      nextScenes.forEach((s, i) => {
        if (!nextNodePositions[s.id]) {
          nextNodePositions[s.id] = { x: 100 + i * 180, y: 100 }
        }
      })
      removeCanonIds.forEach((id) => delete nextNodePositions[id])
      const nextEdges = state.project.edges.filter(
        (e) => keepIds.has(e.sourceSceneId) && keepIds.has(e.targetSceneId)
      )
      const activeSceneId = state.activeBeatId
        ? nextCanonScenes.find((s) => s.beats.some((b) => b.id === state.activeBeatId))?.id
        : undefined
      const nextSelected =
        activeSceneId && createdSceneIds.has(activeSceneId)
          ? activeSceneId
          : state.selectedSceneId && nextScenes.some((s) => s.id === state.selectedSceneId)
          ? state.selectedSceneId
          : nextScenes[0]?.id ?? null
      return {
        project: applySceneNumbers({
          ...state.project,
          scenes: nextScenes,
          edges: nextEdges,
          nodePositions: nextNodePositions,
        }),
        selectedSceneId: nextSelected,
        dirty: true,
      }
    })
  },

  setBeats: (sceneId, beats) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const nextProject = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      if (!nextProject) return state
      return {
        project: applySceneNumbers(nextProject),
        dirty: true,
      }
    })
  },

  addBeat: (sceneId, beat, index) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const next = [...scene.beats]
      if (index != null) next.splice(index, 0, beat)
      else next.push(beat)
      const nextProject = replaceScene(state, sceneId, () => ({ ...scene, beats: next }))
      if (!nextProject) return state
      return { project: applySceneNumbers(nextProject), dirty: true }
    })
  },

  updateBeat: (sceneId, beatId, patch) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = scene.beats.map((b) =>
        b.id === beatId ? { ...b, ...patch } : b
      ) as Beat[]
      const nextProject = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      if (!nextProject) return state
      return { project: applySceneNumbers(nextProject), dirty: true }
    })
  },

  removeBeat: (sceneId, beatId) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = scene.beats.filter((b) => b.id !== beatId)
      const nextProject = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      if (!nextProject) return state
      return { project: applySceneNumbers(nextProject), dirty: true }
    })
  },

  reorderBeats: (sceneId, fromIndex, toIndex) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = [...scene.beats]
      const [removed] = beats.splice(fromIndex, 1)
      beats.splice(toIndex, 0, removed)
      const nextProject = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      if (!nextProject) return state
      return { project: applySceneNumbers(nextProject), dirty: true }
    })
  },

  addEdge: (edge) => {
    set((state) => {
      if (!state.project) return state
      const next = { ...state.project, edges: [...state.project.edges, edge] }
      return { project: applySceneNumbers(next), dirty: true }
    })
  },

  addEdgeFromConnection: (sourceSceneId, targetSceneId) => {
    const sourceScene = get().getScene(sourceSceneId)
    const targetScene = get().getScene(targetSceneId)
    if (!sourceScene) throw new Error('Source scene not found')
    if (!targetScene) throw new Error('Target scene not found')
    const invalid =
      (sourceScene.sceneKind === 'branch' && targetScene.sceneKind === 'branch') ||
      (sourceScene.sceneKind === 'branch' && targetScene.sceneKind !== 'canon')
    if (invalid) throw new Error('Invalid branch connection')
    const edge = createGraphEdge(sourceSceneId, targetSceneId, { label: '' })
    set((state) => {
      if (!state.project) return state
      const next = {
        ...state.project,
        edges: [...state.project.edges, edge],
      }
      return { project: applySceneNumbers(next), dirty: true }
    })
    return edge
  },

  updateEdge: (edgeId, patch) => {
    set((state) => {
      if (!state.project) return state
      const next = {
        ...state.project,
        edges: state.project.edges.map((e) => (e.id === edgeId ? { ...e, ...patch } : e)),
      }
      return { project: applySceneNumbers(next), dirty: true }
    })
  },

  removeEdge: (edgeId) => {
    set((state) => {
      if (!state.project) return state
      const next = {
        ...state.project,
        edges: state.project.edges.filter((e) => e.id !== edgeId),
      }
      return { project: applySceneNumbers(next), dirty: true }
    })
  },

  setNodePosition: (sceneId, position) => {
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          nodePositions: { ...state.project.nodePositions, [sceneId]: position },
        },
        dirty: true,
      }
    })
  },

  setNodePositions: (positions) => {
    set((state) => {
      if (!state.project) return state
      return { project: { ...state.project, nodePositions: positions }, dirty: true }
    })
  },

  newProject: () => {
    set({
      project: createEmptyProject(),
      selectedSceneId: null,
      projectFilePath: null,
      dirty: false,
    })
  },
}))

