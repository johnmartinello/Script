import { useState, useMemo } from 'react'
import { useProjectStore } from '@/renderer/store/projectStore'
import { computeProjectStats, type ProjectStatsScope } from '@/shared/projectStats'

export function StatsPanel() {
  const project = useProjectStore((s) => s.project)
  const [scope, setScope] = useState<ProjectStatsScope>('canon')

  const stats = useMemo(() => {
    if (!project) return null
    return computeProjectStats(project, scope)
  }, [project, scope])

  if (!project || !stats) {
    return (
      <div className="p-6 text-sm text-[rgb(var(--text-muted))]">
        Stats will appear once you have a project with at least one scene.
      </div>
    )
  }

  const totalTimeLabel = formatSecondsLabel(stats.totalSpokenSeconds)

  const totalCharacterSpokenSeconds = stats.characters.reduce(
    (sum, c) => sum + c.spokenSeconds,
    0
  )

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold">Project stats</h2>
          <p className="text-xs text-[rgb(var(--text-muted))]">
            Overview of scenes, characters, and dialogue for this project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[rgb(var(--text-muted))]">Scope</span>
          <div className="flex rounded border border-border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setScope('canon')}
              className={`px-3 py-1 ${
                scope === 'canon'
                  ? 'bg-[rgb(var(--bg))] text-[rgb(var(--text))]'
                  : 'bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]'
              }`}
            >
              Canon only
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1 border-l border-border ${
                scope === 'all'
                  ? 'bg-[rgb(var(--bg))] text-[rgb(var(--text))]'
                  : 'bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]'
              }`}
            >
              All scenes
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-auto px-4 py-4 space-y-4">
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Scenes (total)"
              value={stats.sceneCountTotal.toString()}
              hint={`Canon ${stats.sceneCountCanon}, branch ${stats.sceneCountBranch}`}
            />
            <StatCard
              label="Unique characters"
              value={stats.uniqueCharacterCount.toString()}
              hint="From character cues"
            />
            <StatCard
              label="Dialogue lines"
              value={stats.totalDialogueLines.toString()}
              hint={scope === 'canon' ? 'Canon scenes only' : 'All scenes'}
            />
            <StatCard
              label="Estimated spoken time"
              value={totalTimeLabel}
              hint="Approximate, based on line length"
            />
          </div>
        </section>

        {stats.sceneCountUnattachedBranch > 0 && (
          <section>
            <div className="border border-border bg-[rgb(var(--bg-muted))] text-xs px-3 py-2 rounded">
              <span className="font-medium">
                {stats.sceneCountUnattachedBranch} unattached branch
                {stats.sceneCountUnattachedBranch === 1 ? ' scene' : ' scenes'}
              </span>{' '}
              <span className="text-[rgb(var(--text-muted))]">
                have missing canon links. These do not affect counts but may indicate incomplete
                structure.
              </span>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold mb-2">Characters by dialogue</h3>
          {stats.characters.length === 0 ? (
            <p className="text-xs text-[rgb(var(--text-muted))]">
              No dialogue found in the current scope.
            </p>
          ) : (
            <div className="border border-border rounded overflow-hidden text-xs">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-[rgb(var(--bg-muted))] px-3 py-2 font-medium">
                <div>Character</div>
                <div className="text-right">Lines</div>
                <div className="text-right">Scene participation</div>
                <div className="text-right">Estimated time</div>
                <div className="text-right">Share</div>
              </div>
              <div className="divide-y divide-border">
                {stats.characters.map((c) => {
                  const label = formatSecondsLabel(c.spokenSeconds)
                  const pct =
                    totalCharacterSpokenSeconds > 0
                      ? Math.round((c.spokenSeconds / totalCharacterSpokenSeconds) * 100)
                      : 0
                  const participationPct = Math.round(c.sceneParticipationRate * 100)
                  return (
                    <div
                      key={c.name}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] px-3 py-2 items-center"
                    >
                      <div className="truncate">{c.name}</div>
                      <div className="text-right">{c.lineCount}</div>
                      <div className="text-right">
                        {c.sceneCount} ({participationPct}%)
                      </div>
                      <div className="text-right">{label}</div>
                      <div className="text-right text-[rgb(var(--text-muted))]">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-2">Dialogue density by chapter</h3>
          {stats.chapters.length === 0 ? (
            <p className="text-xs text-[rgb(var(--text-muted))]">No chapter stats available yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.chapters.map((chapter) => (
                <div key={chapter.chapterId ?? 'unassigned'} className="border border-border rounded p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium truncate">{chapter.chapterTitle}</h4>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {chapter.sceneCount} scenes, {chapter.totalDialogueLines} dialogue lines, density{' '}
                        {chapter.dialogueLinesPerScene} lines/scene
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[rgb(var(--text-muted))]">
                    {chapter.characters.length === 0 ? (
                      <span>No character dialogue in this chapter.</span>
                    ) : (
                      <span>
                        Character lines:{' '}
                        {chapter.characters
                          .slice(0, 8)
                          .map((character) => `${character.name} (${character.lineCount})`)
                          .join(', ')}
                        {chapter.characters.length > 8 ? ', ...' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-2">Scene composition & structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              label="Scenes in current scope"
              value={stats.sceneComposition.sceneCountInScope.toString()}
              hint={scope === 'canon' ? 'Canon scenes only' : 'Canon + branch scenes'}
            />
            <StatCard
              label="Scenes with dialogue"
              value={stats.sceneComposition.scenesWithDialogue.toString()}
              hint={`${stats.sceneComposition.scenesWithoutDialogue} without dialogue`}
            />
            <StatCard
              label="Avg beats per scene"
              value={stats.sceneComposition.avgBeatsPerScene.toString()}
              hint="Overall scene complexity"
            />
            <StatCard
              label="Avg dialogue lines per scene"
              value={stats.sceneComposition.avgDialogueLinesPerScene.toString()}
              hint="Scene dialogue density"
            />
            <StatCard
              label="Single-speaker scenes"
              value={stats.sceneComposition.singleSpeakerScenes.toString()}
              hint={`${stats.sceneComposition.multiSpeakerScenes} multi-speaker scenes`}
            />
            <StatCard
              label="Avg unique speakers / scene"
              value={stats.sceneComposition.avgUniqueSpeakersPerScene.toString()}
              hint="Conversation breadth"
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function formatSecondsLabel(secondsValue: number): string {
  const minutes = Math.floor(secondsValue / 60)
  const secondsRemainder = Math.round(secondsValue % 60)
  return minutes > 0 ? `${minutes}m ${secondsRemainder}s` : `${secondsRemainder}s`
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border rounded px-3 py-2 flex flex-col gap-1 bg-[rgb(var(--bg-muted))]">
      <div className="text-[0.7rem] uppercase tracking-wide text-[rgb(var(--text-muted))]">
        {label}
      </div>
      <div className="text-lg font-semibold leading-none">{value}</div>
      {hint ? (
        <div className="text-[0.7rem] text-[rgb(var(--text-muted))] truncate">{hint}</div>
      ) : null}
    </div>
  )
}

