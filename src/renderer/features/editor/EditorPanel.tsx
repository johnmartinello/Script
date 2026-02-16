import { useProjectStore } from '@/renderer/store/projectStore'
import { ScreenplayEditor } from './ScreenplayEditor'

export function EditorPanel() {
  const selectedSceneId = useProjectStore((s) => s.selectedSceneId)
  const getScene = useProjectStore((s) => s.getScene)
  const setBeats = useProjectStore((s) => s.setBeats)

  const scene = selectedSceneId ? getScene(selectedSceneId) : null

  if (!selectedSceneId || !scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-[rgb(var(--text-muted))] p-8">
        Select a scene or create one to start writing.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-2 shrink-0">
        <input
          type="text"
          value={scene.title}
          onChange={(e) => useProjectStore.getState().updateScene(scene.id, { title: e.target.value })}
          className="bg-transparent border-none text-lg font-medium w-full focus:outline-none focus:ring-0"
          placeholder="Scene title"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <ScreenplayEditor
          sceneId={scene.id}
          beats={scene.beats}
          onBeatsChange={(beats) => setBeats(scene.id, beats)}
        />
      </div>
    </div>
  )
}
