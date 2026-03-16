import type { PointerEvent } from 'react'
import type { BoardImageItem } from '@/shared/model'

interface BoardItemImageProps {
  item: BoardImageItem
  selected?: boolean
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onResizeStart: (event: PointerEvent<HTMLButtonElement>) => void
  onDelete: () => void
}

export function BoardItemImage({
  item,
  selected = false,
  onPointerDown,
  onResizeStart,
  onDelete,
}: BoardItemImageProps) {
  return (
    <div
      className={`w-full h-full rounded-md bg-[rgb(var(--bg))] shadow-sm overflow-hidden border ${
        selected ? 'ring-2 ring-[rgb(var(--accent))] border-[rgb(var(--accent))]' : 'border-transparent'
      }`}
      onPointerDown={onPointerDown}
    >
      <img
        src={item.dataUrl}
        alt={item.filename || 'Board image'}
        draggable={false}
        className="w-full h-full object-contain bg-[rgb(var(--bg-muted))] select-none"
      />
      <button
        type="button"
        title="Delete"
        className="absolute right-1.5 top-1.5 w-5 h-5 rounded-full text-xs leading-none text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-muted))]"
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
      >
        ×
      </button>
      <button
        type="button"
        title="Resize"
        className="absolute right-1.5 bottom-1.5 w-3 h-3 rounded-sm bg-[rgb(var(--text-muted))]/35 cursor-se-resize"
        onPointerDown={onResizeStart}
      />
    </div>
  )
}
