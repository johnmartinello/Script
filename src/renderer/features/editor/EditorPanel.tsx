import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/renderer/store/projectStore'
import { ScreenplayEditor } from './ScreenplayEditor'

export function EditorPanel() {
  const project = useProjectStore((s) => s.project)
  const getAllBeatsFlat = useProjectStore((s) => s.getAllBeatsFlat)
  const syncDocumentToScenes = useProjectStore((s) => s.syncDocumentToScenes)
  const selectedSceneId = useProjectStore((s) => s.selectedSceneId)
  const getScene = useProjectStore((s) => s.getScene)
  const setBeats = useProjectStore((s) => s.setBeats)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastScrollToSceneId = useRef<string | null>(null)

  const allBeats = getAllBeatsFlat()
  const selectedScene = selectedSceneId ? getScene(selectedSceneId) : undefined
  const isBranchMode = selectedScene?.sceneKind === 'branch'
  const editorBeats = isBranchMode ? (selectedScene?.beats ?? []) : allBeats

  useEffect(() => {
    if (isBranchMode) return
    if (!selectedSceneId || !scrollContainerRef.current) return
    if (lastScrollToSceneId.current === selectedSceneId) return
    lastScrollToSceneId.current = selectedSceneId
    const scene = getScene(selectedSceneId)
    const sourceBeatId = scene?.sourceBeatId
    if (!sourceBeatId) return
    const el = scrollContainerRef.current.querySelector(`[data-beat-id="${sourceBeatId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedSceneId, getScene, isBranchMode])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[rgb(var(--text-muted))] p-8">
        Select a scene or create one to start writing.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <div
        ref={scrollContainerRef}
        className="screenplay-editor-canvas flex-1 min-h-0 overflow-auto px-6 py-0"
      >
        <ScreenplayEditor
          beats={editorBeats}
          onBeatsChange={(beats) => {
            if (isBranchMode && selectedSceneId) {
              setBeats(selectedSceneId, beats)
              return
            }
            syncDocumentToScenes(beats)
          }}
        />
      </div>
    </div>
  )
}
