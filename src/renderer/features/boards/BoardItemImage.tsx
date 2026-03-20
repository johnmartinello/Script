import { useState, type PointerEvent } from 'react'
import type { BoardImageItem } from '@/shared/model'

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface BoardItemImageProps {
  item: BoardImageItem
  selected?: boolean
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onResizeStart: (direction: ResizeDirection, event: PointerEvent<HTMLDivElement>) => void
  onDelete: () => void
}

export function BoardItemImage({
  item,
  selected = false,
  onPointerDown,
  onResizeStart,
  onDelete,
}: BoardItemImageProps) {
  const [hoveringBorder, setHoveringBorder] = useState(false)

  const resizeHandles = [
    { direction: 'n', className: 'inset-x-0 -top-[3px] h-[6px] cursor-ns-resize z-20' },
    { direction: 's', className: 'inset-x-0 -bottom-[3px] h-[6px] cursor-ns-resize z-20' },
    { direction: 'e', className: 'inset-y-0 -right-[3px] w-[6px] cursor-ew-resize z-20' },
    { direction: 'w', className: 'inset-y-0 -left-[3px] w-[6px] cursor-ew-resize z-20' },
    { direction: 'nw', className: '-left-[3px] -top-[3px] h-[14px] w-[14px] cursor-nwse-resize z-30' },
    { direction: 'ne', className: '-right-[3px] -top-[3px] h-[14px] w-[14px] cursor-nesw-resize z-30' },
    { direction: 'se', className: '-right-[3px] -bottom-[3px] h-[14px] w-[14px] cursor-nwse-resize z-30' },
    { direction: 'sw', className: '-left-[3px] -bottom-[3px] h-[14px] w-[14px] cursor-nesw-resize z-30' },
  ] as const

  const borderClass = selected || hoveringBorder ? 'border-[rgb(var(--border))]' : 'border-transparent'

  return (
    <div
      className={`relative h-full w-full rounded-md border bg-[rgb(var(--bg))] shadow-sm ${borderClass}`}
      onPointerDown={onPointerDown}
      onPointerEnter={() => setHoveringBorder(true)}
      onPointerLeave={() => setHoveringBorder(false)}
    >
      {resizeHandles.map((handle) => (
        <div
          key={handle.direction}
          className={`absolute ${handle.className}`}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            // Ensure pointer events (and therefore resize stop) keep routing to this handle.
            event.currentTarget.setPointerCapture(event.pointerId)
            onResizeStart(handle.direction, event)
          }}
        />
      ))}
      <div className="h-full w-full overflow-hidden rounded-md">
        <img
          src={item.dataUrl}
          alt={item.filename || 'Board image'}
          draggable={false}
          className="h-full w-full select-none bg-[rgb(var(--bg-muted))] object-contain"
        />
      </div>
      <button
        type="button"
        title="Delete"
        className="absolute right-1.5 top-1.5 z-30 w-5 h-5 rounded-full text-xs leading-none text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-muted))]"
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
      >
        ×
      </button>
    </div>
  )
}
