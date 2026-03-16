import type { BeatType, Project, Scene } from '@/shared/model'
import { GSCRIPT_VERSION } from '@/shared/model'

const VALID_BEAT_TYPES: BeatType[] = [
  'scene-heading',
  'action',
  'character-cue',
  'dialogue',
  'parenthetical',
  'transition',
]

function normalizeScene(scene: Scene): Scene {
  const sceneKind = scene.sceneKind ?? 'canon'
  const branchMeta =
    sceneKind === 'branch'
      ? {
          precedingCanonSceneId: scene.branchMeta?.precedingCanonSceneId ?? null,
          followingCanonSceneId: scene.branchMeta?.followingCanonSceneId ?? null,
          conditionText: scene.branchMeta?.conditionText ?? '',
          branchOrder: scene.branchMeta?.branchOrder ?? 0,
        }
      : null
  const beats = (scene.beats ?? []).map((beat) => {
    if (!VALID_BEAT_TYPES.includes(beat.type as BeatType)) {
      return {
        id: beat.id,
        type: 'action' as const,
        text: '',
      }
    }
    return beat
  })
  return {
    ...scene,
    sceneKind,
    branchMeta,
    beats,
  }
}

function normalizeProject(raw: Project): Project {
  const version = raw.version ?? 1
  return {
    ...raw,
    scenes: (raw.scenes ?? []).map((s) => normalizeScene(s as Scene)),
    chapters: raw.chapters ?? [],
    nodePositions: raw.nodePositions ?? {},
    edges: raw.edges ?? [],
    version: Math.max(version, GSCRIPT_VERSION),
  }
}

export async function openProject(): Promise<{ path: string; project: Project } | null> {
  const result = await window.ipcRenderer.invoke<{ path: string | null; data: string | null }>(
    'project:open'
  )
  if (!result.path || !result.data) return null
  const raw = JSON.parse(result.data) as Project
  const project = normalizeProject(raw)
  return { path: result.path, project }
}

export async function saveProject(
  path: string | null,
  project: Project
): Promise<string | null> {
  const data = JSON.stringify(project, null, 2)
  const result = await window.ipcRenderer.invoke<{ path: string | null }>('project:save', {
    path,
    data,
  })
  return result.path
}
