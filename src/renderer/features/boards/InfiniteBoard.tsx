import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import type { BoardDocument, BoardImageItem, BoardItem, BoardKey, BoardTextItem, BoardViewport } from '@/shared/model'
import { BoardItemText } from './BoardItemText'
import { BoardItemImage } from './BoardItemImage'
import { clampZoom, screenToWorld, worldToScreen } from './boardGeometry'
import { getImageFileFromClipboard, readFileAsDataUrl } from './imageUtils'

interface InfiniteBoardProps {
  boardKey: BoardKey
  board: BoardDocument
  onViewportChange: (viewport: BoardViewport) => void
  onUpdateItem: (itemId: string, patch: Partial<BoardItem>) => void
  onRemoveItem: (itemId: string) => void
  onAddImage: (params: { x: number; y: number; dataUrl: string; filename?: string | null }) => void
}

interface PanState {
  startClientX: number
  startClientY: number
  startViewport: BoardViewport
}

interface DragState {
  itemId: string
  startClientX: number
  startClientY: number
  startX: number
  startY: number
}

interface ResizeState {
  itemId: string
  startClientX: number
  startClientY: number
  startW: number
  startH: number
}

export function InfiniteBoard({
  boardKey,
  board,
  onViewportChange,
  onUpdateItem,
  onRemoveItem,
  onAddImage,
}: InfiniteBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [panState, setPanState] = useState<PanState | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const pointerWorldRef = useRef({ x: board.viewport.cx, y: board.viewport.cy })

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const update = () => {
      const rect = node.getBoundingClientRect()
      setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (panState) {
        const dx = event.clientX - panState.startClientX
        const dy = event.clientY - panState.startClientY
        onViewportChange({
          ...panState.startViewport,
          cx: panState.startViewport.cx - dx / board.viewport.zoom,
          cy: panState.startViewport.cy - dy / board.viewport.zoom,
        })
      } else if (dragState) {
        const dx = event.clientX - dragState.startClientX
        const dy = event.clientY - dragState.startClientY
        onUpdateItem(dragState.itemId, {
          x: dragState.startX + dx / board.viewport.zoom,
          y: dragState.startY + dy / board.viewport.zoom,
          z: Date.now(),
        })
      } else if (resizeState) {
        const dx = event.clientX - resizeState.startClientX
        const dy = event.clientY - resizeState.startClientY
        onUpdateItem(resizeState.itemId, {
          w: Math.max(120, resizeState.startW + dx / board.viewport.zoom),
          h: Math.max(80, resizeState.startH + dy / board.viewport.zoom),
        })
      }
    }

    const onUp = () => {
      setPanState(null)
      setDragState(null)
      setResizeState(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [board.viewport.zoom, dragState, onUpdateItem, onViewportChange, panState, resizeState])

  const sortedItems = useMemo(
    () =>
      Object.values(board.items).sort((a, b) => {
        if (a.z === b.z) return a.createdAt - b.createdAt
        return a.z - b.z
      }),
    [board.items]
  )

  const updatePointerWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    pointerWorldRef.current = screenToWorld(
      { x: clientX - rect.left, y: clientY - rect.top },
      board.viewport,
      size
    )
  }

  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    ;(event.currentTarget as HTMLDivElement).focus()
    setPanState({
      startClientX: event.clientX,
      startClientY: event.clientY,
      startViewport: board.viewport,
    })
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pointerScreen = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const worldBefore = screenToWorld(pointerScreen, board.viewport, size)
    const factor = event.deltaY < 0 ? 1.1 : 0.9
    const zoom = clampZoom(board.viewport.zoom * factor)
    onViewportChange({
      zoom,
      cx: worldBefore.x - (pointerScreen.x - size.width / 2) / zoom,
      cy: worldBefore.y - (pointerScreen.y - size.height / 2) / zoom,
    })
  }

  const handlePaste = async (event: ClipboardEvent<HTMLDivElement>) => {
    const file = getImageFileFromClipboard(event.nativeEvent)
    if (!file) return
    event.preventDefault()
    const dataUrl = await readFileAsDataUrl(file)
    const at = pointerWorldRef.current
    onAddImage({ x: at.x, y: at.y, dataUrl, filename: file.name || null })
  }

  const onItemPointerDown = (item: BoardItem, event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    setDragState({
      itemId: item.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
    })
    onUpdateItem(item.id, { z: Date.now() })
  }

  const onItemResizeStart = (item: BoardItem, event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    setResizeState({
      itemId: item.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startW: item.w,
      startH: item.h,
    })
    onUpdateItem(item.id, { z: Date.now() })
  }

  return (
    <div
      key={boardKey}
      ref={containerRef}
      tabIndex={0}
      onPointerMove={(event) => updatePointerWorld(event.clientX, event.clientY)}
      onPointerDown={handleCanvasPointerDown}
      onWheel={handleWheel}
      onPaste={handlePaste}
      className="relative h-full w-full overflow-hidden outline-none bg-[rgb(var(--bg))]"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(120,120,120,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,120,0.15) 1px, transparent 1px)',
        backgroundSize: `${48 * board.viewport.zoom}px ${48 * board.viewport.zoom}px`,
        backgroundPosition: `${(-board.viewport.cx * board.viewport.zoom + size.width / 2) % (48 * board.viewport.zoom)}px ${(-board.viewport.cy * board.viewport.zoom + size.height / 2) % (48 * board.viewport.zoom)}px`,
      }}
    >
      {sortedItems.map((item) => {
        const topLeft = worldToScreen({ x: item.x, y: item.y }, board.viewport, size)
        const width = item.w * board.viewport.zoom
        const height = item.h * board.viewport.zoom
        const commonStyle = {
          left: `${topLeft.x}px`,
          top: `${topLeft.y}px`,
          width: `${width}px`,
          height: `${height}px`,
          zIndex: item.z,
        }

        if (item.type === 'text') {
          const textItem = item as BoardTextItem
          return (
            <div key={item.id} className="absolute" style={commonStyle}>
              <BoardItemText
                item={textItem}
                onPointerDown={(event) => onItemPointerDown(item, event)}
                onResizeStart={(event) => onItemResizeStart(item, event)}
                onTextChange={(text) => onUpdateItem(item.id, { text })}
                onDelete={() => onRemoveItem(item.id)}
              />
            </div>
          )
        }

        const imageItem = item as BoardImageItem
        return (
          <div key={item.id} className="absolute" style={commonStyle}>
            <BoardItemImage
              item={imageItem}
              onPointerDown={(event) => onItemPointerDown(item, event)}
              onResizeStart={(event) => onItemResizeStart(item, event)}
              onDelete={() => onRemoveItem(item.id)}
            />
          </div>
        )
      })}
    </div>
  )
}
