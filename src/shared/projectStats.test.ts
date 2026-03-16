import { computeProjectStats } from './projectStats'
import { createEmptyProject, createScene } from '@/shared/model'

describe('computeProjectStats', () => {
  it('computes character participation, chapter density, and composition stats', () => {
    const project = createEmptyProject('Test')

    const scene = {
      ...createScene('S1'),
      chapterId: 'ch1',
      beats: [
        { id: 'h1', type: 'scene-heading' as const, text: 'INT. ROOM - DAY' },
        { id: 'c1', type: 'character-cue' as const, text: 'Alice' },
        { id: 'd1', type: 'dialogue' as const, text: 'Hello.' },
        { id: 'p1', type: 'parenthetical' as const, text: '(whispers)' },
        { id: 'd2', type: 'dialogue' as const, text: 'Be quiet.' },
        { id: 'c2', type: 'character-cue' as const, text: 'Bob' },
        { id: 'd3', type: 'dialogue' as const, text: 'Okay.' },
      ],
    }

    project.chapters.push({ id: 'ch1', title: 'Act 1', sceneIds: [scene.id] })
    project.scenes.push(scene)

    const stats = computeProjectStats(project, 'canon')

    expect(stats.sceneCountCanon).toBe(1)
    expect(stats.totalDialogueLines).toBe(3)
    expect(stats.sceneComposition.sceneCountInScope).toBe(1)
    expect(stats.sceneComposition.scenesWithDialogue).toBe(1)
    expect(stats.sceneComposition.avgDialogueLinesPerScene).toBe(3)
    const alice = stats.characters.find((c) => c.name === 'Alice')
    const bob = stats.characters.find((c) => c.name === 'Bob')
    expect(alice?.lineCount).toBe(2)
    expect(alice?.sceneCount).toBe(1)
    expect(alice?.sceneParticipationRate).toBe(1)
    expect(bob?.lineCount).toBe(1)

    expect(stats.chapters).toHaveLength(1)
    expect(stats.chapters[0]?.chapterTitle).toBe('Act 1')
    expect(stats.chapters[0]?.dialogueLinesPerScene).toBe(3)
    expect(stats.chapters[0]?.characters[0]?.name).toBe('Alice')
  })
})

