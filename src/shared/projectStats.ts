import type { Project, Scene, Beat, BeatDialogue, BeatParenthetical, BeatCharacterCue } from '@/shared/model'

export type ProjectStatsScope = 'canon' | 'all'

export interface CharacterStats {
  name: string
  lineCount: number
  sceneCount: number
  sceneParticipationRate: number
  /** Estimated spoken time in seconds. */
  spokenSeconds: number
}

export interface ChapterCharacterLineCount {
  name: string
  lineCount: number
}

export interface ChapterStats {
  chapterId: string | null
  chapterTitle: string
  sceneCount: number
  totalDialogueLines: number
  dialogueLinesPerScene: number
  characters: ChapterCharacterLineCount[]
}

export interface SceneCompositionStats {
  sceneCountInScope: number
  scenesWithDialogue: number
  scenesWithoutDialogue: number
  singleSpeakerScenes: number
  multiSpeakerScenes: number
  avgBeatsPerScene: number
  avgDialogueLinesPerScene: number
  avgUniqueSpeakersPerScene: number
}

export interface ProjectStats {
  scope: ProjectStatsScope
  sceneCountTotal: number
  sceneCountCanon: number
  sceneCountBranch: number
  sceneCountUnattachedBranch: number
  uniqueCharacterCount: number
  totalDialogueLines: number
  totalSpokenSeconds: number
  characters: CharacterStats[]
  chapters: ChapterStats[]
  sceneComposition: SceneCompositionStats
}

const MIN_LINE_SECONDS = 0.6
const CHARS_PER_SECOND = 14

function isCharacterCue(beat: Beat): beat is BeatCharacterCue {
  return beat.type === 'character-cue'
}

function isDialogue(beat: Beat): beat is BeatDialogue {
  return beat.type === 'dialogue'
}

function isParenthetical(beat: Beat): beat is BeatParenthetical {
  return beat.type === 'parenthetical'
}

function normalizeCharacterName(input: string | null | undefined): string {
  return (input ?? '').trim().replace(/\s+/g, ' ')
}

function estimateLineSeconds(text: string, parenthetical?: string | null): number {
  const dialog = text.trim()
  const parenth = (parenthetical ?? '').trim()
  const dialogChars = dialog.length
  const parentheticalChars = parenth.length
  const effectiveChars = dialogChars + parentheticalChars * 0.35
  if (effectiveChars <= 0) return 0
  const seconds = effectiveChars / CHARS_PER_SECOND
  return Math.max(MIN_LINE_SECONDS, seconds)
}

function selectScenes(project: Project, scope: ProjectStatsScope): Scene[] {
  if (scope === 'canon') {
    return project.scenes.filter((s) => s.sceneKind === 'canon')
  }
  return project.scenes
}

function isUnattachedBranch(scene: Scene): boolean {
  if (scene.sceneKind !== 'branch' || !scene.branchMeta) return false
  const { precedingCanonSceneId, followingCanonSceneId } = scene.branchMeta
  return !precedingCanonSceneId || !followingCanonSceneId
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function buildSceneChapterMap(project: Project): Map<string, string> {
  const map = new Map<string, string>()
  for (const chapter of project.chapters) {
    for (const sceneId of chapter.sceneIds) {
      map.set(sceneId, chapter.id)
    }
  }
  return map
}

export function computeProjectStats(project: Project, scope: ProjectStatsScope): ProjectStats {
  const scenes = selectScenes(project, scope)

  const allCanonScenes = project.scenes.filter((s) => s.sceneKind === 'canon')
  const allBranchScenes = project.scenes.filter((s) => s.sceneKind === 'branch')

  const sceneCountCanon = allCanonScenes.length
  const sceneCountBranch = allBranchScenes.length
  const sceneCountUnattachedBranch = allBranchScenes.filter(isUnattachedBranch).length

  const sceneCountTotal = project.scenes.length

  const characterMap = new Map<string, { name: string; lineCount: number; spokenSeconds: number }>()
  const characterSceneMap = new Map<string, Set<string>>()

  const sceneIdToChapterId = buildSceneChapterMap(project)
  const chapterTitleById = new Map(project.chapters.map((chapter) => [chapter.id, chapter.title]))
  const chapterOrderById = new Map(project.chapters.map((chapter, index) => [chapter.id, index]))
  const chapterMap = new Map<
    string,
    {
      chapterId: string | null
      chapterTitle: string
      sceneCount: number
      totalDialogueLines: number
      characterLineCounts: Map<string, ChapterCharacterLineCount>
      order: number
    }
  >()

  let totalDialogueLines = 0
  let totalSpokenSeconds = 0
  let totalBeats = 0
  let scenesWithDialogue = 0
  let singleSpeakerScenes = 0
  let multiSpeakerScenes = 0
  let totalUniqueSpeakersAcrossScenes = 0

  for (const scene of scenes) {
    let currentSpeaker: string | null = null
    let currentParenthetical: string | null = null
    let sceneDialogueLines = 0
    const sceneSpeakerKeys = new Set<string>()
    const sceneCharacterKeys = new Set<string>()

    const chapterId = scene.chapterId ?? sceneIdToChapterId.get(scene.id) ?? null
    const chapterKey = chapterId ?? '__unassigned__'
    const chapterTitle = chapterId
      ? chapterTitleById.get(chapterId) ?? `Chapter ${chapterId.slice(0, 6)}`
      : 'Unassigned chapter'
    const chapterOrder = chapterId ? (chapterOrderById.get(chapterId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    const chapter =
      chapterMap.get(chapterKey) ??
      {
        chapterId,
        chapterTitle,
        sceneCount: 0,
        totalDialogueLines: 0,
        characterLineCounts: new Map<string, ChapterCharacterLineCount>(),
        order: chapterOrder,
      }
    chapter.sceneCount += 1
    chapterMap.set(chapterKey, chapter)
    totalBeats += scene.beats.length

    for (const beat of scene.beats) {
      if (isCharacterCue(beat)) {
        const normalized = normalizeCharacterName(beat.text)
        currentSpeaker = normalized
        currentParenthetical = null
        const key = normalized.toLowerCase()
        if (key) {
          sceneCharacterKeys.add(key)
          if (!characterMap.has(key)) {
            characterMap.set(key, {
              name: normalized,
              lineCount: 0,
              spokenSeconds: 0,
            })
          }
        }
        continue
      }

      if (isParenthetical(beat)) {
        currentParenthetical = beat.text
        continue
      }

      if (isDialogue(beat)) {
        const name = normalizeCharacterName(currentSpeaker)
        const key = name.toLowerCase() || '__no_speaker__'
        const seconds = estimateLineSeconds(beat.text ?? '', currentParenthetical)

        sceneDialogueLines += 1
        totalDialogueLines += 1
        totalSpokenSeconds += seconds

        const existing = characterMap.get(key) ?? {
          name: name || 'Unassigned',
          lineCount: 0,
          spokenSeconds: 0,
        }
        existing.lineCount += 1
        existing.spokenSeconds += seconds
        characterMap.set(key, existing)

        if (key !== '__no_speaker__') {
          sceneCharacterKeys.add(key)
          sceneSpeakerKeys.add(key)
        }

        chapter.totalDialogueLines += 1
        const chapterCharacter = chapter.characterLineCounts.get(key) ?? {
          name: existing.name,
          lineCount: 0,
        }
        chapterCharacter.lineCount += 1
        chapter.characterLineCounts.set(key, chapterCharacter)
      }
    }

    if (sceneDialogueLines > 0) {
      scenesWithDialogue += 1
    }
    totalUniqueSpeakersAcrossScenes += sceneSpeakerKeys.size
    if (sceneSpeakerKeys.size === 1) {
      singleSpeakerScenes += 1
    } else if (sceneSpeakerKeys.size > 1) {
      multiSpeakerScenes += 1
    }

    for (const characterKey of sceneCharacterKeys) {
      const scenesForCharacter = characterSceneMap.get(characterKey) ?? new Set<string>()
      scenesForCharacter.add(scene.id)
      characterSceneMap.set(characterKey, scenesForCharacter)
    }
  }

  const scopeSceneCount = scenes.length
  const characters: CharacterStats[] = Array.from(characterMap.entries())
    .map(([key, character]) => {
      const sceneCount = characterSceneMap.get(key)?.size ?? 0
      return {
        ...character,
        sceneCount,
        sceneParticipationRate: scopeSceneCount > 0 ? sceneCount / scopeSceneCount : 0,
      }
    })
    .sort((a, b) => {
    if (b.lineCount !== a.lineCount) return b.lineCount - a.lineCount
    if (b.sceneCount !== a.sceneCount) return b.sceneCount - a.sceneCount
    return a.name.localeCompare(b.name)
  })

  const uniqueCharacterCount = characters.filter((c) => c.name !== 'Unassigned').length

  const chapters: ChapterStats[] = Array.from(chapterMap.values())
    .map((chapter) => {
      const charactersByLines = Array.from(chapter.characterLineCounts.values()).sort((a, b) => {
        if (b.lineCount !== a.lineCount) return b.lineCount - a.lineCount
        return a.name.localeCompare(b.name)
      })
      return {
        chapterId: chapter.chapterId,
        chapterTitle: chapter.chapterTitle,
        sceneCount: chapter.sceneCount,
        totalDialogueLines: chapter.totalDialogueLines,
        dialogueLinesPerScene:
          chapter.sceneCount > 0 ? round2(chapter.totalDialogueLines / chapter.sceneCount) : 0,
        characters: charactersByLines,
      }
    })
    .sort((a, b) => {
      const orderA = a.chapterId ? (chapterOrderById.get(a.chapterId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
      const orderB = b.chapterId ? (chapterOrderById.get(b.chapterId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) return orderA - orderB
      return a.chapterTitle.localeCompare(b.chapterTitle)
    })

  const sceneComposition: SceneCompositionStats = {
    sceneCountInScope: scopeSceneCount,
    scenesWithDialogue,
    scenesWithoutDialogue: Math.max(0, scopeSceneCount - scenesWithDialogue),
    singleSpeakerScenes,
    multiSpeakerScenes,
    avgBeatsPerScene: scopeSceneCount > 0 ? round2(totalBeats / scopeSceneCount) : 0,
    avgDialogueLinesPerScene: scopeSceneCount > 0 ? round2(totalDialogueLines / scopeSceneCount) : 0,
    avgUniqueSpeakersPerScene:
      scopeSceneCount > 0 ? round2(totalUniqueSpeakersAcrossScenes / scopeSceneCount) : 0,
  }

  return {
    scope,
    sceneCountTotal,
    sceneCountCanon,
    sceneCountBranch,
    sceneCountUnattachedBranch,
    uniqueCharacterCount,
    totalDialogueLines,
    totalSpokenSeconds,
    characters,
    chapters,
    sceneComposition,
  }
}

