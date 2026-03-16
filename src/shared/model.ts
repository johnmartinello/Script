/**
 * Domain model for .gscript project file.
 * Single source of truth for Project, Scene, Beat, Graph, and branching metadata.
 */

export type BeatType =
  | 'scene-heading'
  | 'action'
  | 'character-cue'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'

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

export type Beat =
  | BeatSceneHeading
  | BeatAction
  | BeatCharacterCue
  | BeatDialogue
  | BeatParenthetical
  | BeatTransition

export type SceneKind = 'canon' | 'branch'

export interface BranchMeta {
  /** Canon scene that precedes this branch in the main flow. */
  precedingCanonSceneId: string | null
  /** Canon scene that follows this branch in the main flow. */
  followingCanonSceneId: string | null
  /** Free-text condition/description for when this branch should play. */
  conditionText: string
  /**
   * Stable creation-order index within the same preceding canon scene.
   * Used for numbering: N.1, N.2, ...
   */
  branchOrder: number
}

export interface Scene {
  id: string
  title: string
  beats: Beat[]
  /** Whether this scene is part of the canon flow or a branched extra scene. */
  sceneKind: SceneKind
  /** Branch metadata when sceneKind === 'branch'. Null for canon scenes. */
  branchMeta: BranchMeta | null
  /** Optional chapter/act id for grouping. */
  chapterId: string | null
  /** Optional display number for UI/export (e.g. "2.b"). */
  displayNumber?: string | null
  /** When scene was created from a scene-heading beat, id of that beat. */
  sourceBeatId?: string | null
}

export interface GraphNodePosition {
  x: number
  y: number
}

export type BoardKey = `project:${string}` | `scene:${string}` | `character:${string}`

export interface BoardViewport {
  /** World-space x coordinate at viewport center. */
  cx: number
  /** World-space y coordinate at viewport center. */
  cy: number
  /** Zoom scale (1 = 100%). */
  zoom: number
}

export type BoardItemType = 'text' | 'image'
export type BoardTextFormat = 'plain' | 'html'
export type BoardTextAlign = 'left' | 'center' | 'right'

export interface BoardItemBase {
  id: string
  type: BoardItemType
  x: number
  y: number
  w: number
  h: number
  z: number
  createdAt: number
  updatedAt: number
}

export interface BoardTextItem extends BoardItemBase {
  type: 'text'
  text: string
  textFormat?: BoardTextFormat
  textAlign?: BoardTextAlign
  boldAll?: boolean
}

export interface BoardImageItem extends BoardItemBase {
  type: 'image'
  /**
   * Image stored as a Data URL (e.g. "data:image/png;base64,...") so the board is
   * self-contained inside the .gscript JSON.
   */
  dataUrl: string
  /** Optional original filename for UX. */
  filename?: string | null
}

export type BoardItem = BoardTextItem | BoardImageItem

export interface BoardDocument {
  viewport: BoardViewport
  items: Record<string, BoardItem>
}

/** Edge in the story graph. Source/target are scene ids. */
export interface GraphEdge {
  id: string
  sourceSceneId: string
  targetSceneId: string
  label: string
  condition: string
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
  chapters: ChapterGroup[]
  /** Scene id -> { x, y } for React Flow layout. */
  nodePositions: Record<string, GraphNodePosition>
  /** Milanote-like boards keyed by project, scene, or character. */
  boardsByKey?: Partial<Record<BoardKey, BoardDocument>>
}

export function createEmptyProject(name: string = 'Untitled'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    scenes: [],
    edges: [],
    chapters: [],
    nodePositions: {},
    boardsByKey: {},
  }
}

export function createScene(title: string = 'Untitled Scene'): Scene {
  return {
    id: crypto.randomUUID(),
    title,
    beats: [],
    sceneKind: 'canon',
    branchMeta: null,
    chapterId: null,
  }
}

export function createGraphEdge(
  sourceSceneId: string,
  targetSceneId: string,
  options: { label?: string; condition?: string } = {}
): GraphEdge {
  return {
    id: crypto.randomUUID(),
    sourceSceneId,
    targetSceneId,
    label: options.label ?? '',
    condition: options.condition ?? '',
  }
}

export function newBeatId(): string {
  return crypto.randomUUID()
}
