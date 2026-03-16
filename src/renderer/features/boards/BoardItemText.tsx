import type { PointerEvent } from 'react'
import type { BoardTextItem } from '@/shared/model'

interface BoardItemTextProps {
  item: BoardTextItem
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onResizeStart: (event: PointerEvent<HTMLButtonElement>) => void
  onTextChange: (text: string) => void
  onDelete: () => void
}

export function BoardItemText({
  item,
  onPointerDown,
  onResizeStart,
  onTextChange,
  onDelete,
}: BoardItemTextProps) {
  return (
    <div
      className="w-full h-full rounded-md border border-border bg-[rgb(var(--bg))] shadow-md overflow-hidden"
      onPointerDown={onPointerDown}
    >
      <div className="h-7 px-2 flex items-center justify-between border-b border-border bg-[rgb(var(--bg-muted))]">
        <span className="text-xs text-[rgb(var(--text-muted))]">Text</span>
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
      <textarea
        value={item.text}
        onChange={(event) => onTextChange(event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
        className="w-full h-[calc(100%-1.75rem)] resize-none bg-transparent p-2 text-sm outline-none"
        placeholder="Write a note..."
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
