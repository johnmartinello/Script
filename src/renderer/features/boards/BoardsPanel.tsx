import { useEffect, useMemo, useRef } from 'react'
import type { BoardKey } from '@/shared/model'
import { useProjectStore } from '@/renderer/store/projectStore'
import { BoardsSidebar } from './BoardsSidebar'
import { InfiniteBoard } from './InfiniteBoard'
import { readFileAsDataUrl } from './imageUtils'

function boardTitleFromKey(
  boardKey: BoardKey,
  context: { sceneTitleById: Map<string, string>; characterNameByKey: Map<BoardKey, string> }
): string {
  if (boardKey.startsWith('scene:')) {
    const sceneId = boardKey.slice('scene:'.length)
    return context.sceneTitleById.get(sceneId) ?? 'Scene Board'
  }
  return context.characterNameByKey.get(boardKey) ?? 'Character Board'
}

export function BoardsPanel() {
  const project = useProjectStore((s) => s.project)
  const selectedBoardKey = useProjectStore((s) => s.selectedBoardKey)
  const setSelectedBoardKey = useProjectStore((s) => s.setSelectedBoardKey)
  const ensureSceneBoard = useProjectStore((s) => s.ensureSceneBoard)
  const ensureCharacterBoard = useProjectStore((s) => s.ensureCharacterBoard)
  const getDerivedCharacters = useProjectStore((s) => s.getDerivedCharacters)
  const getBoard = useProjectStore((s) => s.getBoard)
  const setBoardViewport = useProjectStore((s) => s.setBoardViewport)
  const addTextBoardItem = useProjectStore((s) => s.addTextBoardItem)
  const addImageBoardItem = useProjectStore((s) => s.addImageBoardItem)
  const updateBoardItem = useProjectStore((s) => s.updateBoardItem)
  const removeBoardItem = useProjectStore((s) => s.removeBoardItem)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const scenes = project?.scenes ?? []
  const characters = getDerivedCharacters()

  useEffect(() => {
    if (!project) return
    if (selectedBoardKey && getBoard(selectedBoardKey)) return
    const firstScene = project.scenes[0]
    if (firstScene) {
      const key = ensureSceneBoard(firstScene.id)
      setSelectedBoardKey(key)
      return
    }
    const firstCharacter = characters[0]
    if (firstCharacter) {
      const key = ensureCharacterBoard(firstCharacter.name)
      setSelectedBoardKey(key)
    }
  }, [
    characters,
    ensureCharacterBoard,
    ensureSceneBoard,
    getBoard,
    project,
    selectedBoardKey,
    setSelectedBoardKey,
  ])

  const activeBoardKey = selectedBoardKey
  const activeBoard = activeBoardKey ? getBoard(activeBoardKey) : undefined

  const sceneTitleById = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, scene.title || 'Untitled Scene'])),
    [scenes]
  )
  const characterNameByKey = useMemo(
    () => new Map(characters.map((character) => [character.key, character.name])),
    [characters]
  )

  const activeTitle =
    activeBoardKey && activeBoard
      ? boardTitleFromKey(activeBoardKey, { sceneTitleById, characterNameByKey })
      : 'No board selected'

  const handleAddText = () => {
    if (!activeBoardKey || !activeBoard) return
    const { cx, cy } = activeBoard.viewport
    addTextBoardItem(activeBoardKey, { x: cx - 120, y: cy - 80, text: '' })
  }

  const handleUploadImage = async (file: File | null) => {
    if (!file || !activeBoardKey || !activeBoard) return
    const dataUrl = await readFileAsDataUrl(file)
    const { cx, cy } = activeBoard.viewport
    addImageBoardItem(activeBoardKey, {
      x: cx - 160,
      y: cy - 120,
      dataUrl,
      filename: file.name || null,
    })
  }

  return (
    <div className="flex-1 min-w-0 h-full flex overflow-hidden">
      <BoardsSidebar
        scenes={scenes}
        characters={characters}
        selectedBoardKey={activeBoardKey}
        onSelectScene={(sceneId) => {
          const key = ensureSceneBoard(sceneId)
          setSelectedBoardKey(key)
        }}
        onSelectCharacter={(name) => {
          const key = ensureCharacterBoard(name)
          setSelectedBoardKey(key)
        }}
      />
      <section className="flex-1 min-w-0 h-full flex flex-col">
        <header className="h-11 px-3 border-b border-border flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-medium truncate">{activeTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddText}
              disabled={!activeBoardKey || !activeBoard}
              className="px-2 py-1 text-sm rounded border border-border bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))] disabled:opacity-60"
            >
              Add Text
            </button>
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={!activeBoardKey || !activeBoard}
              className="px-2 py-1 text-sm rounded border border-border bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))] disabled:opacity-60"
            >
              Upload Image
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0] ?? null
                await handleUploadImage(file)
                event.currentTarget.value = ''
              }}
            />
          </div>
        </header>

        <div className="flex-1 min-h-0">
          {!activeBoardKey || !activeBoard ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-[rgb(var(--text-muted))]">
              Select a scene or character board.
            </div>
          ) : (
            <InfiniteBoard
              boardKey={activeBoardKey}
              board={activeBoard}
              onViewportChange={(viewport) => setBoardViewport(activeBoardKey, viewport)}
              onUpdateItem={(itemId, patch) => updateBoardItem(activeBoardKey, itemId, patch)}
              onRemoveItem={(itemId) => removeBoardItem(activeBoardKey, itemId)}
              onAddImage={(params) => addImageBoardItem(activeBoardKey, params)}
            />
          )}
        </div>
      </section>
    </div>
  )
}
