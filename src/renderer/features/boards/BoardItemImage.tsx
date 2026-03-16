import type { PointerEvent } from 'react'
import type { BoardImageItem } from '@/shared/model'

interface BoardItemImageProps {
  item: BoardImageItem
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onResizeStart: (event: PointerEvent<HTMLButtonElement>) => void
  onDelete: () => void
}

export function BoardItemImage({ item, onPointerDown, onResizeStart, onDelete }: BoardItemImageProps) {
  return (
    <div
      className="w-full h-full rounded-md border border-border bg-[rgb(var(--bg))] shadow-md overflow-hidden"
      onPointerDown={onPointerDown}
    >
      <div className="h-7 px-2 flex items-center justify-between border-b border-border bg-[rgb(var(--bg-muted))]">
        <span className="text-xs text-[rgb(var(--text-muted))] truncate">
          {item.filename || 'Image'}
        </span>
        <button
          type="button"
          className="text-xs px-1.5 py-0.5 rounded hover:bg-[rgb(var(--border))]"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          Delete
        </button>
      </div>
      <img
        src={item.dataUrl}
        alt={item.filename || 'Board image'}
        draggable={false}
        className="w-full h-[calc(100%-1.75rem)] object-cover select-none"
        onPointerDown={(event) => event.stopPropagation()}
      />
      <button
        type="button"
        title="Resize"
        className="absolute right-0.5 bottom-0.5 w-3 h-3 rounded-sm bg-[rgb(var(--border))] cursor-se-resize"
        onPointerDown={onResizeStart}
      />
    </div>
  )
}
