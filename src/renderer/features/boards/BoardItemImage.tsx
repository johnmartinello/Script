import type { PointerEvent } from 'react'
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
  const resizeHandles = [
    { direction: 'n', className: 'left-2 right-2 -top-1 h-2 cursor-ns-resize' },
    { direction: 's', className: 'left-2 right-2 -bottom-1 h-2 cursor-ns-resize' },
    { direction: 'e', className: '-right-1 top-2 bottom-2 w-2 cursor-ew-resize' },
    { direction: 'w', className: '-left-1 top-2 bottom-2 w-2 cursor-ew-resize' },
    { direction: 'ne', className: '-right-1 -top-1 h-3 w-3 cursor-nesw-resize' },
    { direction: 'nw', className: '-left-1 -top-1 h-3 w-3 cursor-nwse-resize' },
    { direction: 'se', className: '-right-1 -bottom-1 h-3 w-3 cursor-nwse-resize' },
    { direction: 'sw', className: '-left-1 -bottom-1 h-3 w-3 cursor-nesw-resize' },
  ] as const

  return (
    <div
      className={`w-full h-full rounded-md bg-[rgb(var(--bg))] shadow-sm overflow-hidden border ${
        selected ? 'ring-2 ring-[rgb(var(--accent))] border-[rgb(var(--accent))]' : 'border-transparent'
      }`}
      onPointerDown={onPointerDown}
    >
      {selected
        ? resizeHandles.map((handle) => (
            <div
              key={handle.direction}
              className={`absolute z-20 ${handle.className}`}
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onResizeStart(handle.direction, event)
              }}
            />
          ))
        : null}
      <img
        src={item.dataUrl}
        alt={item.filename || 'Board image'}
        draggable={false}
        className="w-full h-full object-contain bg-[rgb(var(--bg-muted))] select-none"
      />
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
