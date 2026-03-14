import { useProjectStore } from '@/renderer/store/projectStore'
import { ScreenplayEditor } from './ScreenplayEditor'

export function EditorPanel() {
  const selectedSceneId = useProjectStore((s) => s.selectedSceneId)
  const getScene = useProjectStore((s) => s.getScene)
  const setBeats = useProjectStore((s) => s.setBeats)
  const syncScenesFromHeadings = useProjectStore((s) => s.syncScenesFromHeadings)

  const scene = selectedSceneId ? getScene(selectedSceneId) : null

  if (!selectedSceneId || !scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-[rgb(var(--text-muted))] p-8">
        Select a scene or create one to start writing.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <div className="border-b border-border px-4 py-2 shrink-0 flex items-center gap-2">
        {scene.displayNumber && (
          <span className="text-sm text-[rgb(var(--text-muted))] shrink-0">{scene.displayNumber}</span>
        )}
        <input
          type="text"
          value={scene.title}
          onChange={(e) => useProjectStore.getState().updateScene(scene.id, { title: e.target.value })}
          className="bg-transparent border-none text-lg font-medium w-full focus:outline-none focus:ring-0"
          placeholder="Scene title"
        />
      </div>
      <div className="screenplay-editor-canvas flex-1 min-h-0 overflow-auto px-6 py-0">
        <ScreenplayEditor
          sceneId={scene.id}
          beats={scene.beats}
          onBeatsChange={(beats) => {
          setBeats(scene.id, beats)
          syncScenesFromHeadings(scene.id, beats)
        }}
        />
      </div>
    </div>
  )
}
