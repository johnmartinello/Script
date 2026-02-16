import { create } from 'zustand'
import type {
  Project,
  Scene,
  Beat,
  GraphEdge,
  GraphNodePosition,
  Variable,
  ChoiceOption,
} from '@/shared/model'
import {
  createEmptyProject,
  createScene,
  createGraphEdge,
  createVariable,
  createChoiceOption,
  newBeatId,
} from '@/shared/model'

export type ViewMode = 'editor' | 'graph' | 'split' | 'help'

interface ProjectState {
  project: Project
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
}

interface ProjectActions {
  setProject: (project: Project) => void
  setProjectFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  setSelectedSceneId: (id: string | null) => void
  setViewMode: (mode: ViewMode) => void
  toggleReferenceSidebar: () => void
  setActiveBeatType: (type: Beat['type'] | null) => void

  addScene: (title?: string) => Scene
  updateScene: (sceneId: string, patch: Partial<Pick<Scene, 'title' | 'chapterId'>>) => void
  deleteScene: (sceneId: string) => void
  getScene: (sceneId: string) => Scene | undefined

  setBeats: (sceneId: string, beats: Beat[]) => void
  addBeat: (sceneId: string, beat: Beat, index?: number) => void
  updateBeat: (sceneId: string, beatId: string, patch: Partial<Beat>) => void
  removeBeat: (sceneId: string, beatId: string) => void
  reorderBeats: (sceneId: string, fromIndex: number, toIndex: number) => void

  addEdge: (edge: GraphEdge) => void
  /** Create a choice point in source scene and an edge to target (graph -> editor sync). */
  addEdgeFromConnection: (sourceSceneId: string, targetSceneId: string) => GraphEdge
  updateEdge: (edgeId: string, patch: Partial<GraphEdge>) => void
  removeEdge: (edgeId: string) => void
  setNodePosition: (sceneId: string, position: GraphNodePosition) => void
  setNodePositions: (positions: Record<string, GraphNodePosition>) => void

  addVariable: (variable: Variable) => void
  updateVariable: (variableId: string, patch: Partial<Variable>) => void
  removeVariable: (variableId: string) => void

  addChoiceOption: (sceneId: string, beatId: string) => ChoiceOption
  updateChoiceOption: (
    sceneId: string,
    beatId: string,
    optionId: string,
    patch: Partial<ChoiceOption>
  ) => void
  removeChoiceOption: (sceneId: string, beatId: string, optionId: string) => void

  newProject: () => void
}

function getScene(state: ProjectState, sceneId: string): Scene | undefined {
  return state.project.scenes.find((s) => s.id === sceneId)
}

function replaceScene(state: ProjectState, sceneId: string, updater: (s: Scene) => Scene): Project {
  return {
    ...state.project,
    scenes: state.project.scenes.map((s) => (s.id === sceneId ? updater(s) : s)),
  }
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  project: createEmptyProject(),
  selectedSceneId: null,
  viewMode: 'editor',
  projectFilePath: null,
  dirty: false,
  referenceSidebarOpen: false,
  activeBeatType: null,

  setProject: (project) => set({ project, dirty: false }),
  setProjectFilePath: (path) => set({ projectFilePath: path }),
  setDirty: (dirty) => set({ dirty }),
  setSelectedSceneId: (id) => set({ selectedSceneId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleReferenceSidebar: () =>
    set((state) => ({ referenceSidebarOpen: !state.referenceSidebarOpen })),
  setActiveBeatType: (type) => set({ activeBeatType: type }),

  addScene: (title) => {
    const scene = createScene(title ?? 'Untitled Scene')
    set((state) => ({
      project: {
        ...state.project,
        scenes: [...state.project.scenes, scene],
        nodePositions: {
          ...state.project.nodePositions,
          [scene.id]: { x: 100 + state.project.scenes.length * 180, y: 100 },
        },
      },
      selectedSceneId: scene.id,
      viewMode: 'editor',
      dirty: true,
    }))
    return scene
  },

  updateScene: (sceneId, patch) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      return {
        project: replaceScene(state, sceneId, (s) => ({ ...s, ...patch })),
        dirty: true,
      }
    })
  },

  deleteScene: (sceneId) => {
    set((state) => ({
      project: {
        ...state.project,
        scenes: state.project.scenes.filter((s) => s.id !== sceneId),
        edges: state.project.edges.filter(
          (e) => e.sourceSceneId !== sceneId && e.targetSceneId !== sceneId
        ),
        nodePositions: Object.fromEntries(
          Object.entries(state.project.nodePositions).filter(([id]) => id !== sceneId)
        ),
      },
      selectedSceneId: state.selectedSceneId === sceneId ? null : state.selectedSceneId,
      dirty: true,
    }))
  },

  getScene: (sceneId) => getScene(get(), sceneId),

  setBeats: (sceneId, beats) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const nextProject = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      const optionIdsWithTarget = new Set<string>()
      beats.forEach((b) => {
        if (b.type === 'choice-point') {
          b.options.forEach((o) => {
            if (o.targetSceneId) optionIdsWithTarget.add(o.id)
          })
        }
      })
      const edgesFromScene = nextProject.edges.filter((e) => e.sourceSceneId === sceneId)
      const toRemove = edgesFromScene.filter(
        (e) => e.choiceOptionId != null && !optionIdsWithTarget.has(e.choiceOptionId)
      )
      const toAdd: GraphEdge[] = []
      const edgeUpdates: Record<string, Partial<GraphEdge>> = {}
      beats.forEach((b) => {
        if (b.type !== 'choice-point') return
        b.options.forEach((o) => {
          if (!o.targetSceneId) return
          const existing = nextProject.edges.find(
            (e) => e.sourceSceneId === sceneId && e.choiceOptionId === o.id
          )
          if (existing) {
            if (
              existing.targetSceneId !== o.targetSceneId ||
              existing.label !== o.label ||
              existing.condition !== o.condition
            ) {
              edgeUpdates[existing.id] = {
                targetSceneId: o.targetSceneId,
                label: o.label,
                condition: o.condition,
              }
            }
          } else {
            toAdd.push(createGraphEdge(sceneId, o.targetSceneId, {
              choiceOptionId: o.id,
              label: o.label,
              condition: o.condition,
            }))
          }
        })
      })
      const removeIds = new Set(toRemove.map((e) => e.id))
      let nextEdges = nextProject.edges.filter((e) => !removeIds.has(e.id))
      nextEdges = nextEdges.map((e) => (edgeUpdates[e.id] ? { ...e, ...edgeUpdates[e.id] } : e))
      nextEdges = [...nextEdges, ...toAdd]
      return {
        project: { ...nextProject, edges: nextEdges },
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
      return {
        project: replaceScene(state, sceneId, () => ({ ...scene, beats: next })),
        dirty: true,
      }
    })
  },

  updateBeat: (sceneId, beatId, patch) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = scene.beats.map((b) =>
        b.id === beatId ? { ...b, ...patch } : b
      ) as Beat[]
      return {
        project: replaceScene(state, sceneId, () => ({ ...scene, beats })),
        dirty: true,
      }
    })
  },

  removeBeat: (sceneId, beatId) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beat = scene.beats.find((b) => b.id === beatId)
      const optionIds =
        beat?.type === 'choice-point' ? new Set(beat.options.map((o) => o.id)) : new Set<string>()
      const beats = scene.beats.filter((b) => b.id !== beatId)
      const edgesToRemove = state.project.edges.filter(
        (e) => e.sourceSceneId === sceneId && e.choiceOptionId != null && optionIds.has(e.choiceOptionId)
      )
      let project = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      if (edgesToRemove.length > 0) {
        const ids = new Set(edgesToRemove.map((e) => e.id))
        project = {
          ...project,
          edges: project.edges.filter((e) => !ids.has(e.id)),
        }
      }
      return { project, dirty: true }
    })
  },

  reorderBeats: (sceneId, fromIndex, toIndex) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = [...scene.beats]
      const [removed] = beats.splice(fromIndex, 1)
      beats.splice(toIndex, 0, removed)
      return {
        project: replaceScene(state, sceneId, () => ({ ...scene, beats })),
        dirty: true,
      }
    })
  },

  addEdge: (edge) => {
    set((state) => ({
      project: { ...state.project, edges: [...state.project.edges, edge] },
      dirty: true,
    }))
  },

  addEdgeFromConnection: (sourceSceneId, targetSceneId) => {
    const scene = get().getScene(sourceSceneId)
    if (!scene) throw new Error('Source scene not found')
    const option = createChoiceOption()
    const choiceBeat: Beat = {
      id: newBeatId(),
      type: 'choice-point',
      options: [{ ...option, targetSceneId, label: '' }],
    }
    const edge = createGraphEdge(sourceSceneId, targetSceneId, {
      choiceOptionId: option.id,
      label: '',
    })
    set((state) => {
      const scene2 = getScene(state, sourceSceneId)!
      const nextScenes = state.project.scenes.map((s) =>
        s.id === sourceSceneId ? { ...s, beats: [...s.beats, choiceBeat] } : s
      )
      return {
        project: {
          ...state.project,
          scenes: nextScenes,
          edges: [...state.project.edges, edge],
        },
        dirty: true,
      }
    })
    return edge
  },

  updateEdge: (edgeId, patch) => {
    set((state) => ({
      project: {
        ...state.project,
        edges: state.project.edges.map((e) => (e.id === edgeId ? { ...e, ...patch } : e)),
      },
      dirty: true,
    }))
  },

  removeEdge: (edgeId) => {
    set((state) => ({
      project: {
        ...state.project,
        edges: state.project.edges.filter((e) => e.id !== edgeId),
      },
      dirty: true,
    }))
  },

  setNodePosition: (sceneId, position) => {
    set((state) => ({
      project: {
        ...state.project,
        nodePositions: { ...state.project.nodePositions, [sceneId]: position },
      },
      dirty: true,
    }))
  },

  setNodePositions: (positions) => {
    set((state) => ({
      project: { ...state.project, nodePositions: positions },
      dirty: true,
    }))
  },

  addVariable: (variable) => {
    set((state) => ({
      project: {
        ...state.project,
        variables: [...state.project.variables, variable],
      },
      dirty: true,
    }))
  },

  updateVariable: (variableId, patch) => {
    set((state) => ({
      project: {
        ...state.project,
        variables: state.project.variables.map((v) =>
          v.id === variableId ? { ...v, ...patch } : v
        ),
      },
      dirty: true,
    }))
  },

  removeVariable: (variableId) => {
    set((state) => ({
      project: {
        ...state.project,
        variables: state.project.variables.filter((v) => v.id !== variableId),
      },
      dirty: true,
    }))
  },

  addChoiceOption: (sceneId, beatId) => {
    const option = createChoiceOption()
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = scene.beats.map((b) => {
        if (b.id !== beatId || b.type !== 'choice-point') return b
        return { ...b, options: [...b.options, option] }
      }) as Beat[]
      return {
        project: replaceScene(state, sceneId, () => ({ ...scene, beats })),
        dirty: true,
      }
    })
    return option
  },

  updateChoiceOption: (sceneId, beatId, optionId, patch) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = scene.beats.map((b) => {
        if (b.id !== beatId || b.type !== 'choice-point') return b
        return {
          ...b,
          options: b.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
        }
      }) as Beat[]
      let project = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      if (patch.targetSceneId !== undefined) {
        const existing = project.edges.find(
          (e) => e.sourceSceneId === sceneId && e.choiceOptionId === optionId
        )
        if (patch.targetSceneId) {
          if (existing) {
            project = {
              ...project,
              edges: project.edges.map((e) =>
                e.id === existing.id
                  ? { ...e, targetSceneId: patch.targetSceneId!, label: patch.label ?? e.label }
                  : e
              ),
            }
          } else {
            const edge = createGraphEdge(sceneId, patch.targetSceneId, {
              choiceOptionId: optionId,
              label: patch.label ?? '',
              condition: patch.condition ?? '',
            })
            project = { ...project, edges: [...project.edges, edge] }
          }
        } else if (existing) {
          project = {
            ...project,
            edges: project.edges.filter((e) => e.id !== existing.id),
          }
        }
      }
      return { project, dirty: true }
    })
  },

  removeChoiceOption: (sceneId, beatId, optionId) => {
    set((state) => {
      const scene = getScene(state, sceneId)
      if (!scene) return state
      const beats = scene.beats.map((b) => {
        if (b.id !== beatId || b.type !== 'choice-point') return b
        return { ...b, options: b.options.filter((o) => o.id !== optionId) }
      }) as Beat[]
      const edgesToRemove = state.project.edges.filter((e) => e.choiceOptionId === optionId)
      let project = replaceScene(state, sceneId, () => ({ ...scene, beats }))
      if (edgesToRemove.length > 0) {
        const ids = new Set(edgesToRemove.map((e) => e.id))
        project = { ...project, edges: project.edges.filter((e) => !ids.has(e.id)) }
      }
      return { project, dirty: true }
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
