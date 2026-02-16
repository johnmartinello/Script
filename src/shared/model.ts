/**
 * Phase 1 domain model for .gscript project file.
 * Single source of truth for Project, Scene, Beat, Graph, and Variables.
 */

export type BeatType =
  | 'scene-heading'
  | 'action'
  | 'character-cue'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'choice-point'
  | 'set-variable'

export type VariableType = 'boolean' | 'integer' | 'string'

/** Base beat: id and type. */
export interface BeatBase {
  id: string
  type: BeatType
}

export interface BeatSceneHeading extends BeatBase {
  type: 'scene-heading'
  text: string
}

export interface BeatAction extends BeatBase {
  type: 'action'
  text: string
}

export interface BeatCharacterCue extends BeatBase {
  type: 'character-cue'
  text: string
}

export interface BeatDialogue extends BeatBase {
  type: 'dialogue'
  text: string
}

export interface BeatParenthetical extends BeatBase {
  type: 'parenthetical'
  text: string
}

export interface BeatTransition extends BeatBase {
  type: 'transition'
  text: string
}

/** Phase 1: simple condition as string (e.g. "hasKey == true"). */
export interface ChoiceOption {
  id: string
  label: string
  targetSceneId: string | null
  condition: string
}

export interface BeatChoicePoint extends BeatBase {
  type: 'choice-point'
  options: ChoiceOption[]
}

export interface BeatSetVariable extends BeatBase {
  type: 'set-variable'
  variableId: string
  value: string
}

export type Beat =
  | BeatSceneHeading
  | BeatAction
  | BeatCharacterCue
  | BeatDialogue
  | BeatParenthetical
  | BeatTransition
  | BeatChoicePoint
  | BeatSetVariable

export interface Scene {
  id: string
  title: string
  beats: Beat[]
  /** Optional chapter/act id for grouping. */
  chapterId: string | null
}

export interface GraphNodePosition {
  x: number
  y: number
}

/** Edge in the story graph. Source/target are scene ids. */
export interface GraphEdge {
  id: string
  sourceSceneId: string
  targetSceneId: string
  /** Option id from a choice-point beat in source scene (if any). */
  choiceOptionId: string | null
  label: string
  condition: string
}

/** Variable definition (Phase 1: focus on boolean). */
export interface Variable {
  id: string
  name: string
  type: VariableType
  defaultValue: string
}

export interface ChapterGroup {
  id: string
  title: string
  sceneIds: string[]
}

export interface Project {
  id: string
  name: string
  scenes: Scene[]
  edges: GraphEdge[]
  variables: Variable[]
  chapters: ChapterGroup[]
  /** Scene id -> { x, y } for React Flow layout. */
  nodePositions: Record<string, GraphNodePosition>
  /** Schema version for future migrations. */
  version: number
}

export const GSCRIPT_VERSION = 1

export function createEmptyProject(name: string = 'Untitled'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    scenes: [],
    edges: [],
    variables: [],
    chapters: [],
    nodePositions: {},
    version: GSCRIPT_VERSION,
  }
}

export function createScene(title: string = 'Untitled Scene'): Scene {
  return {
    id: crypto.randomUUID(),
    title,
    beats: [],
    chapterId: null,
  }
}

export function createChoiceOption(): ChoiceOption {
  return {
    id: crypto.randomUUID(),
    label: '',
    targetSceneId: null,
    condition: '',
  }
}

export function createVariable(name: string = 'flag'): Variable {
  return {
    id: crypto.randomUUID(),
    name,
    type: 'boolean',
    defaultValue: 'false',
  }
}

export function createGraphEdge(
  sourceSceneId: string,
  targetSceneId: string,
  options: { choiceOptionId?: string | null; label?: string; condition?: string } = {}
): GraphEdge {
  return {
    id: crypto.randomUUID(),
    sourceSceneId,
    targetSceneId,
    choiceOptionId: options.choiceOptionId ?? null,
    label: options.label ?? '',
    condition: options.condition ?? '',
  }
}

export function newBeatId(): string {
  return crypto.randomUUID()
}
