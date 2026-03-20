import type { BoardKey, Scene } from '@/shared/model'
import type { DerivedCharacter } from '@/renderer/store/projectStore'

interface BoardsSidebarProps {
  projectBoardKey: BoardKey | null
  projectName: string | null
  scenes: Scene[]
  characters: DerivedCharacter[]
  selectedBoardKey: BoardKey | null
  onSelectProject: () => void
  onSelectScene: (sceneId: string) => void
  onSelectCharacter: (name: string) => void
}

export function BoardsSidebar({
  projectBoardKey,
  projectName,
  scenes,
  characters,
  selectedBoardKey,
  onSelectProject,
  onSelectScene,
  onSelectCharacter,
}: BoardsSidebarProps) {
  return (
    <aside className="w-72 h-full border-r border-border bg-[rgb(var(--bg-muted))] flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border">
        <h2 className="font-medium">Visual Boards</h2>
        <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
          One infinite canvas per project, scene, and character.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        <section>
          <h3 className="text-xs uppercase tracking-wide text-[rgb(var(--text-muted))] mb-2">Project</h3>
          {projectName && projectBoardKey ? (
            <button
              type="button"
              onClick={onSelectProject}
              className={`w-full text-left px-2 py-1.5 rounded border text-sm ${
                selectedBoardKey === projectBoardKey
                  ? 'bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-border'
                  : 'bg-[rgb(var(--bg))] border-border hover:bg-[rgb(var(--border))]'
              }`}
            >
              {projectName}
            </button>
          ) : (
            <p className="text-xs text-[rgb(var(--text-muted))]">No project loaded.</p>
          )}
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wide text-[rgb(var(--text-muted))] mb-2">Scenes</h3>
          <div className="space-y-1">
            {scenes.map((scene) => {
              const key: BoardKey = `scene:${scene.id}`
              const active = selectedBoardKey === key
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => onSelectScene(scene.id)}
                  className={`w-full text-left px-2 py-1.5 rounded border text-sm ${
                    active
                      ? 'bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-border'
                      : 'bg-[rgb(var(--bg))] border-border hover:bg-[rgb(var(--border))]'
                  }`}
                >
                  {scene.displayNumber ? `${scene.displayNumber} ` : ''}
                  {scene.title || 'Untitled Scene'}
                </button>
              )
            })}
            {scenes.length === 0 && (
              <p className="text-xs text-[rgb(var(--text-muted))]">No scenes yet.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wide text-[rgb(var(--text-muted))] mb-2">Characters</h3>
          <div className="space-y-1">
            {characters.map((character) => {
              const active = selectedBoardKey === character.key
              return (
                <button
                  key={character.key}
                  type="button"
                  onClick={() => onSelectCharacter(character.name)}
                  className={`w-full text-left px-2 py-1.5 rounded border text-sm ${
                    active
                      ? 'bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-border'
                      : 'bg-[rgb(var(--bg))] border-border hover:bg-[rgb(var(--border))]'
                  }`}
                >
                  {character.name}
                </button>
              )
            })}
            {characters.length === 0 && (
              <p className="text-xs text-[rgb(var(--text-muted))]">
                Add `character-cue` beats in the editor to populate this list.
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
