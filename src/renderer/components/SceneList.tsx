import { useProjectStore } from '@/renderer/store/projectStore'

export function SceneList() {
  const scenes = useProjectStore((s) => s.project.scenes)
  const selectedSceneId = useProjectStore((s) => s.selectedSceneId)
  const setSelectedSceneId = useProjectStore((s) => s.setSelectedSceneId)
  const addScene = useProjectStore((s) => s.addScene)

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-[rgb(var(--text-muted))]">Scenes</span>
        <button
          type="button"
          onClick={() => addScene()}
          className="text-sm px-2 py-1 rounded border border-border hover:bg-[rgb(var(--border))]"
          title="New scene"
        >
          + New
        </button>
      </div>
      <ul className="scene-list-scrollbar flex-1 overflow-auto p-1">
        {scenes.length === 0 && (
          <li className="text-sm text-[rgb(var(--text-muted))] p-2">No scenes yet.</li>
        )}
        {scenes.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setSelectedSceneId(s.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
                selectedSceneId === s.id
                  ? 'bg-[rgb(var(--accent))] text-white'
                  : 'hover:bg-[rgb(var(--border))]'
              }`}
            >
              {s.title || 'Untitled'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
