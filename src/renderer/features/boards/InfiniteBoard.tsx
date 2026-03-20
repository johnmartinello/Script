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
  itemIds: string[]
  startClientX: number
  startClientY: number
  startPositions: Record<string, { x: number; y: number }>
}

interface PressState {
  itemIds: string[]
  startClientX: number
  startClientY: number
  startPositions: Record<string, { x: number; y: number }>
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface ResizeState {
  itemId: string
  direction: ResizeDirection
  startClientX: number
  startClientY: number
  startX: number
  startY: number
  startW: number
  startH: number
  minW: number
  minH: number
  lockAspect: boolean
}

interface MarqueeState {
  startScreenX: number
  startScreenY: number
  currentScreenX: number
  currentScreenY: number
  append: boolean
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
  const [marqueeState, setMarqueeState] = useState<MarqueeState | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [editingTextItemId, setEditingTextItemId] = useState<string | null>(null)
  const pointerWorldRef = useRef({ x: board.viewport.cx, y: board.viewport.cy })
  const knownItemIdsRef = useRef<Set<string>>(new Set(Object.keys(board.items)))
  const selectedItemIdSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds])

  useEffect(() => {
    setSelectedItemIds((current) => {
      const next = current.filter((itemId) => !!board.items[itemId])
      if (next.length === current.length && next.every((itemId, index) => itemId === current[index])) {
        return current
      }
      return next
    })
  }, [board.items])

  useEffect(() => {
    if (!editingTextItemId) return
    if (board.items[editingTextItemId]) return
    setEditingTextItemId(null)
  }, [board.items, editingTextItemId])

  useEffect(() => {
    knownItemIdsRef.current = new Set(Object.keys(board.items))
    setSelectedItemIds([])
    setEditingTextItemId(null)
  }, [boardKey])

  useEffect(() => {
    const known = knownItemIdsRef.current
    let newestEmptyTextItem: BoardTextItem | null = null

    for (const item of Object.values(board.items)) {
      if (known.has(item.id)) continue
      if (item.type !== 'text') continue
      const textItem = item as BoardTextItem
      if (textItem.text.trim()) continue
      if (!newestEmptyTextItem || textItem.createdAt > newestEmptyTextItem.createdAt) {
        newestEmptyTextItem = textItem
      }
    }

    knownItemIdsRef.current = new Set(Object.keys(board.items))

    if (newestEmptyTextItem) {
      setSelectedItemIds([newestEmptyTextItem.id])
      setEditingTextItemId(newestEmptyTextItem.id)
    }
  }, [board.items])

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
    const applyFreeResize = (
      state: ResizeState,
      dxWorld: number,
      dyWorld: number
    ): { x: number; y: number; w: number; h: number } => {
      let x = state.startX
      let y = state.startY
      let w = state.startW
      let h = state.startH

      if (state.direction.includes('e')) {
        w = Math.max(state.minW, state.startW + dxWorld)
      }
      if (state.direction.includes('s')) {
        h = Math.max(state.minH, state.startH + dyWorld)
      }
      if (state.direction.includes('w')) {
        const nextW = Math.max(state.minW, state.startW - dxWorld)
        x = state.startX + (state.startW - nextW)
        w = nextW
      }
      if (state.direction.includes('n')) {
        const nextH = Math.max(state.minH, state.startH - dyWorld)
        y = state.startY + (state.startH - nextH)
        h = nextH
      }

      return { x, y, w, h }
    }

    const applyAspectResize = (
      state: ResizeState,
      dxWorld: number,
      dyWorld: number
    ): { x: number; y: number; w: number; h: number } => {
      const aspect = state.startW / state.startH
      const minScale = Math.max(state.minW / state.startW, state.minH / state.startH)
      const horizontal = state.direction === 'e' || state.direction === 'w'
      const vertical = state.direction === 'n' || state.direction === 's'

      let scale = 1
      if (horizontal) {
        const proposedW = state.direction === 'w' ? state.startW - dxWorld : state.startW + dxWorld
        scale = proposedW / state.startW
      } else if (vertical) {
        const proposedH = state.direction === 'n' ? state.startH - dyWorld : state.startH + dyWorld
        scale = proposedH / state.startH
      } else {
        const proposedW = state.direction.includes('w') ? state.startW - dxWorld : state.startW + dxWorld
        const proposedH = state.direction.includes('n') ? state.startH - dyWorld : state.startH + dyWorld
        scale = Math.max(proposedW / state.startW, proposedH / state.startH)
      }

      scale = Math.max(minScale, scale)
      const w = Math.max(state.minW, state.startW * scale)
      const h = Math.max(state.minH, w / aspect)

      let x = state.startX
      let y = state.startY

      if (horizontal) {
        if (state.direction === 'w') {
          x = state.startX + (state.startW - w)
        }
        y = state.startY + (state.startH - h) / 2
      } else if (vertical) {
        if (state.direction === 'n') {
          y = state.startY + (state.startH - h)
        }
        x = state.startX + (state.startW - w) / 2
      } else {
        if (state.direction.includes('w')) {
          x = state.startX + (state.startW - w)
        }
        if (state.direction.includes('n')) {
          y = state.startY + (state.startH - h)
        }
      }

      return { x, y, w, h }
    }

    const getIntersectingIds = (state: MarqueeState): string[] => {
      const startWorld = screenToWorld(
        { x: state.startScreenX, y: state.startScreenY },
        board.viewport,
        size
      )
      const endWorld = screenToWorld(
        { x: state.currentScreenX, y: state.currentScreenY },
        board.viewport,
        size
      )
      const left = Math.min(startWorld.x, endWorld.x)
      const right = Math.max(startWorld.x, endWorld.x)
      const top = Math.min(startWorld.y, endWorld.y)
      const bottom = Math.max(startWorld.y, endWorld.y)

      return Object.values(board.items)
        .filter((item) => {
          const itemLeft = item.x
          const itemRight = item.x + item.w
          const itemTop = item.y
          const itemBottom = item.y + item.h
          return !(itemRight < left || itemLeft > right || itemBottom < top || itemTop > bottom)
        })
        .map((item) => item.id)
    }

    const onMove = (event: globalThis.MouseEvent) => {
      if (resizeState) {
        const dx = event.clientX - resizeState.startClientX
        const dy = event.clientY - resizeState.startClientY
        const dxWorld = dx / board.viewport.zoom
        const dyWorld = dy / board.viewport.zoom
        const next = resizeState.lockAspect
          ? applyAspectResize(resizeState, dxWorld, dyWorld)
          : applyFreeResize(resizeState, dxWorld, dyWorld)
        onUpdateItem(resizeState.itemId, next)
      } else if (panState) {
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
            itemIds: pressState.itemIds,
            startClientX: pressState.startClientX,
            startClientY: pressState.startClientY,
            startPositions: pressState.startPositions,
          })
        }
      } else if (dragState) {
        const dx = event.clientX - dragState.startClientX
        const dy = event.clientY - dragState.startClientY
        const worldDx = dx / board.viewport.zoom
        const worldDy = dy / board.viewport.zoom
        dragState.itemIds.forEach((itemId, index) => {
          const start = dragState.startPositions[itemId]
          if (!start) return
          onUpdateItem(itemId, {
            x: start.x + worldDx,
            y: start.y + worldDy,
            z: Date.now() + index,
          })
        })
      } else if (marqueeState) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        setMarqueeState((current) =>
          current
            ? {
                ...current,
                currentScreenX: event.clientX - rect.left,
                currentScreenY: event.clientY - rect.top,
              }
            : current
        )
      }
    }

    const onUp = () => {
      if (marqueeState) {
        const intersectingIds = getIntersectingIds(marqueeState)
        if (marqueeState.append) {
          setSelectedItemIds((current) => {
            const next = new Set(current)
            intersectingIds.forEach((itemId) => {
              if (next.has(itemId)) {
                next.delete(itemId)
              } else {
                next.add(itemId)
              }
            })
            return Array.from(next)
          })
        } else {
          setSelectedItemIds(intersectingIds)
        }
      }

      setPanState(null)
      setPressState(null)
      setDragState(null)
      setResizeState(null)
      setMarqueeState(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [
    board.items,
    board.viewport,
    dragState,
    marqueeState,
    onUpdateItem,
    onViewportChange,
    panState,
    pressState,
    resizeState,
    size,
  ])

  useEffect(() => {
    const onGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Delete') return
      if (!selectedItemIds.length) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const typingInField =
        tag === 'textarea' || tag === 'input' || !!target?.isContentEditable
      if (typingInField) return
      event.preventDefault()
      selectedItemIds.forEach((itemId) => onRemoveItem(itemId))
      setSelectedItemIds([])
      setEditingTextItemId(null)
    }
    window.addEventListener('keydown', onGlobalKeyDown)
    return () => window.removeEventListener('keydown', onGlobalKeyDown)
  }, [onRemoveItem, selectedItemIds])

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
    ;(event.currentTarget as HTMLDivElement).focus()
    setEditingTextItemId(null)
    if (event.button === 1) {
      event.preventDefault()
      setPanState({
        startClientX: event.clientX,
        startClientY: event.clientY,
        startViewport: board.viewport,
      })
      return
    }
    if (event.button !== 0) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    setMarqueeState({
      startScreenX: screenX,
      startScreenY: screenY,
      currentScreenX: screenX,
      currentScreenY: screenY,
      append: event.shiftKey,
    })
    if (!event.shiftKey) {
      setSelectedItemIds([])
    }
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
    if (event.shiftKey) {
      setSelectedItemIds((current) => {
        if (current.includes(item.id)) return current.filter((id) => id !== item.id)
        return [...current, item.id]
      })
      setEditingTextItemId(null)
      return
    }

    const dragIds = selectedItemIdSet.has(item.id) ? selectedItemIds : [item.id]
    if (!selectedItemIdSet.has(item.id)) {
      setSelectedItemIds([item.id])
    }

    if (item.type !== 'text' || editingTextItemId !== item.id) {
      setEditingTextItemId(null)
    }

    const startPositions = dragIds.reduce<Record<string, { x: number; y: number }>>((acc, itemId) => {
      const currentItem = board.items[itemId]
      if (!currentItem) return acc
      acc[itemId] = { x: currentItem.x, y: currentItem.y }
      return acc
    }, {})

    setPressState({
      itemIds: dragIds,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositions,
    })
    dragIds.forEach((itemId, index) => {
      onUpdateItem(itemId, { z: Date.now() + index })
    })
  }

  const onItemResizeStart = (
    item: BoardItem,
    direction: ResizeDirection,
    event: PointerEvent<HTMLDivElement>
  ) => {
    event.stopPropagation()
    if (event.button !== 0) return
    setResizeState({
      itemId: item.id,
      direction,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.w,
      startH: item.h,
      minW: item.type === 'text' ? 120 : 80,
      minH: 80,
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
    >
      {marqueeState ? (
        <div
          className="pointer-events-none absolute border border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10"
          style={{
            left: `${Math.min(marqueeState.startScreenX, marqueeState.currentScreenX)}px`,
            top: `${Math.min(marqueeState.startScreenY, marqueeState.currentScreenY)}px`,
            width: `${Math.abs(marqueeState.currentScreenX - marqueeState.startScreenX)}px`,
            height: `${Math.abs(marqueeState.currentScreenY - marqueeState.startScreenY)}px`,
            zIndex: 9999,
          }}
        />
      ) : null}
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
                selected={selectedItemIdSet.has(item.id)}
                onPointerDown={(event) => onItemPointerDown(item, event)}
                isEditing={editingTextItemId === item.id}
                onStartEdit={() => {
                  setSelectedItemIds([item.id])
                  setEditingTextItemId(item.id)
                }}
                onFinishEdit={() => {
                  setEditingTextItemId((current) => (current === item.id ? null : current))
                }}
                onResizeStart={(direction, event) => onItemResizeStart(item, direction, event)}
                onTextChange={(text, format) => onUpdateItem(item.id, { text, textFormat: format })}
                onFormatChange={(patch) => onUpdateItem(item.id, patch)}
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
              selected={selectedItemIdSet.has(item.id)}
              onPointerDown={(event) => onItemPointerDown(item, event)}
              onResizeStart={(direction, event) => onItemResizeStart(item, direction, event)}
              onDelete={() => onRemoveItem(item.id)}
            />
          </div>
        )
      })}
    </div>
  )
}
