import type { Project, Scene, Beat, BeatParenthetical, BeatDialogue, BeatCharacterCue } from '@/shared/model'

interface DialogueExportEntry {
  entryId: string
  sceneId: string
  sceneTitle: string
  sceneKind: Scene['sceneKind']
  sceneDisplayNumber?: string | null
  speaker: string | null
  text: string
  parenthetical?: string | null
  branchCondition?: string | null
  precedingCanonSceneId?: string | null
  followingCanonSceneId?: string | null
  branchOrder?: number | null
}

interface DialogueExportPayload {
  projectId: string
  projectName: string
  exportedAt: string
  formatVersion: number
  entries: DialogueExportEntry[]
}

const DIALOGUE_EXPORT_FORMAT_VERSION = 1

function isCharacterCue(beat: Beat): beat is BeatCharacterCue {
  return beat.type === 'character-cue'
}

function isDialogue(beat: Beat): beat is BeatDialogue {
  return beat.type === 'dialogue'
}

function isParenthetical(beat: Beat): beat is BeatParenthetical {
  return beat.type === 'parenthetical'
}

function buildEntriesForScene(scene: Scene): DialogueExportEntry[] {
  const entries: DialogueExportEntry[] = []

  let currentSpeaker: string | null = null
  let currentParenthetical: string | null = null

  for (const beat of scene.beats) {
    if (isCharacterCue(beat)) {
      currentSpeaker = beat.text
      currentParenthetical = null
      continue
    }

    if (isParenthetical(beat)) {
      // Attach the latest parenthetical to subsequent dialogue lines for this speaker.
      currentParenthetical = beat.text
      continue
    }

    if (isDialogue(beat)) {
      const base: DialogueExportEntry = {
        entryId: beat.id,
        sceneId: scene.id,
        sceneTitle: scene.title,
        sceneKind: scene.sceneKind,
        sceneDisplayNumber: scene.displayNumber ?? null,
        speaker: currentSpeaker,
        text: beat.text,
      }

      if (currentParenthetical != null) {
        base.parenthetical = currentParenthetical
      }

      if (scene.sceneKind === 'branch' && scene.branchMeta) {
        base.branchCondition = scene.branchMeta.conditionText ?? null
        base.precedingCanonSceneId = scene.branchMeta.precedingCanonSceneId
        base.followingCanonSceneId = scene.branchMeta.followingCanonSceneId
        base.branchOrder = scene.branchMeta.branchOrder
      }

      entries.push(base)
    }
  }

  return entries
}

export function buildDialogueExport(project: Project): DialogueExportPayload {
  const entries: DialogueExportEntry[] = []

  for (const scene of project.scenes) {
    entries.push(...buildEntriesForScene(scene))
  }

  return {
    projectId: project.id,
    projectName: project.name,
    exportedAt: new Date().toISOString(),
    formatVersion: DIALOGUE_EXPORT_FORMAT_VERSION,
    entries,
  }
}

export function dialogueExportToJson(project: Project): string {
  const payload = buildDialogueExport(project)
  return JSON.stringify(payload, null, 2)
}

export function exportDialogueJson(project: Project): void {
  const json = dialogueExportToJson(project)

  window.ipcRenderer
    .invoke<{ ok: boolean; canceled?: boolean; error?: string }>('export:dialogue-json', {
      json,
      projectName: project.name,
    })
    .then((result) => {
      if (!result.ok && !result.canceled) {
        window.alert(result.error || 'Failed to export dialogue JSON.')
      }
    })
    .catch(() => {
      window.alert('Failed to export dialogue JSON.')
    })
}

