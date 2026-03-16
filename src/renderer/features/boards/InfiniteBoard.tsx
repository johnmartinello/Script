import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import type { BoardDocument, BoardImageItem, BoardItem, BoardKey, BoardTextItem, BoardViewport } from '@/shared/model'
import { BoardItemText } from './BoardItemText'
import { BoardItemImage } from './BoardItemImage'
import { clampZoom, screenToWorld, worldToScreen } from './boardGeometry'
import {
  fitImageIntoBounds,
  getImageDimensions,
  getImageFileFromClipboard,
  readFileAsDataUrl,
} from './imageUtils'

interface InfiniteBoardProps {
  boardKey: BoardKey
  board: BoardDocument
  onViewportChange: (viewport: BoardViewport) => void
  onAddText: (params: { x: number; y: number; text?: string }) => void
  onUpdateItem: (itemId: string, patch: Partial<BoardItem>) => void
  onRemoveItem: (itemId: string) => void
  onAddImage: (params: {
    x: number
    y: number
    w?: number
    h?: number
    dataUrl: string
    filename?: string | null
  }) => void
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

interface PressState {
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
  lockAspect: boolean
}

export function InfiniteBoard({
  boardKey,
  board,
  onViewportChange,
  onAddText,
  onUpdateItem,
  onRemoveItem,
  onAddImage,
}: InfiniteBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [panState, setPanState] = useState<PanState | null>(null)
  const [pressState, setPressState] = useState<PressState | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [editingTextItemId, setEditingTextItemId] = useState<string | null>(null)
  const pointerWorldRef = useRef({ x: board.viewport.cx, y: board.viewport.cy })

  useEffect(() => {
    if (!selectedItemId) return
    if (board.items[selectedItemId]) return
    setSelectedItemId(null)
    setEditingTextItemId((current) => (current === selectedItemId ? null : current))
  }, [board.items, selectedItemId])

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
    const onMove = (event: globalThis.MouseEvent) => {
      if (panState) {
        const dx = event.clientX - panState.startClientX
        const dy = event.clientY - panState.startClientY
        onViewportChange({
          ...panState.startViewport,
          cx: panState.startViewport.cx - dx / board.viewport.zoom,
          cy: panState.startViewport.cy - dy / board.viewport.zoom,
        })
      } else if (pressState && !dragState) {
        const dx = event.clientX - pressState.startClientX
        const dy = event.clientY - pressState.startClientY
        if (Math.hypot(dx, dy) > 3) {
          setDragState({
            itemId: pressState.itemId,
            startClientX: pressState.startClientX,
            startClientY: pressState.startClientY,
            startX: pressState.startX,
            startY: pressState.startY,
          })
        }
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
        if (resizeState.lockAspect) {
          const widthScale = (resizeState.startW + dx / board.viewport.zoom) / resizeState.startW
          const heightScale = (resizeState.startH + dy / board.viewport.zoom) / resizeState.startH
          const scale = Math.max(0.2, Math.max(widthScale, heightScale))
          onUpdateItem(resizeState.itemId, {
            w: Math.max(80, resizeState.startW * scale),
            h: Math.max(80, resizeState.startH * scale),
          })
        } else {
          onUpdateItem(resizeState.itemId, {
            w: Math.max(120, resizeState.startW + dx / board.viewport.zoom),
            h: Math.max(80, resizeState.startH + dy / board.viewport.zoom),
          })
        }
      }
    }

    const onUp = () => {
      setPanState(null)
      setPressState(null)
      setDragState(null)
      setResizeState(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [board.viewport.zoom, dragState, onUpdateItem, onViewportChange, panState, pressState, resizeState])

  useEffect(() => {
    const onGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Delete') return
      if (!selectedItemId) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const typingInField =
        tag === 'textarea' || tag === 'input' || !!target?.isContentEditable
      if (typingInField) return
      event.preventDefault()
      onRemoveItem(selectedItemId)
      setSelectedItemId(null)
      setEditingTextItemId(null)
    }
    window.addEventListener('keydown', onGlobalKeyDown)
    return () => window.removeEventListener('keydown', onGlobalKeyDown)
  }, [onRemoveItem, selectedItemId])

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
    setSelectedItemId(null)
    setEditingTextItemId(null)
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
    const at = pointerWorldRef.current
    if (file) {
      event.preventDefault()
      const dataUrl = await readFileAsDataUrl(file)
      const dimensions = await getImageDimensions(dataUrl)
      const fitted = fitImageIntoBounds(dimensions, { maxWidth: 420, maxHeight: 320 })
      onAddImage({
        x: at.x,
        y: at.y,
        w: fitted.width,
        h: fitted.height,
        dataUrl,
        filename: file.name || null,
      })
      return
    }

    const text = event.clipboardData.getData('text/plain')
    if (!text.trim()) return
    event.preventDefault()
    onAddText({ x: at.x, y: at.y, text })
  }

  const handleCanvasDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const at = screenToWorld(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      board.viewport,
      size
    )
    onAddText({ x: at.x, y: at.y, text: '' })
  }

  const onItemPointerDown = (item: BoardItem, event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    containerRef.current?.focus()
    setSelectedItemId(item.id)
    if (item.type !== 'text' || editingTextItemId !== item.id) {
      setEditingTextItemId(null)
    }
    setPressState({
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
      lockAspect: item.type === 'image',
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
      onDoubleClick={handleCanvasDoubleClick}
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
                selected={selectedItemId === item.id}
                onPointerDown={(event) => onItemPointerDown(item, event)}
                isEditing={editingTextItemId === item.id}
                onStartEdit={() => {
                  setSelectedItemId(item.id)
                  setEditingTextItemId(item.id)
                }}
                onFinishEdit={() => {
                  setEditingTextItemId((current) => (current === item.id ? null : current))
                }}
                onResizeStart={(event) => onItemResizeStart(item, event)}
                onTextChange={(text) => onUpdateItem(item.id, { text })}
                onPasteImage={async (file) => {
                  const dataUrl = await readFileAsDataUrl(file)
                  const dimensions = await getImageDimensions(dataUrl)
                  const fitted = fitImageIntoBounds(dimensions, { maxWidth: 360, maxHeight: 280 })
                  onAddImage({
                    x: item.x + 24,
                    y: item.y + 24,
                    w: fitted.width,
                    h: fitted.height,
                    dataUrl,
                    filename: file.name || null,
                  })
                }}
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
              selected={selectedItemId === item.id}
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
