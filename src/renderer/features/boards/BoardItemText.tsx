import type { ClipboardEvent, PointerEvent } from 'react'
import type { BoardTextItem } from '@/shared/model'
import { getImageFileFromClipboard } from './imageUtils'

interface BoardItemTextProps {
  item: BoardTextItem
  selected?: boolean
  isEditing?: boolean
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onStartEdit: () => void
  onFinishEdit: () => void
  onResizeStart: (event: PointerEvent<HTMLButtonElement>) => void
  onTextChange: (text: string) => void
  onPasteImage: (file: File) => Promise<void>
  onDelete: () => void
}

export function BoardItemText({
  item,
  selected = false,
  isEditing = false,
  onPointerDown,
  onStartEdit,
  onFinishEdit,
  onResizeStart,
  onTextChange,
  onPasteImage,
  onDelete,
}: BoardItemTextProps) {
  const handleTextareaPaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFile = getImageFileFromClipboard(event.nativeEvent)
    if (!imageFile) return
    event.preventDefault()
    await onPasteImage(imageFile)
  }

  return (
    <div
      className={`w-full h-full rounded-md bg-[rgb(var(--bg-muted))] shadow-sm overflow-hidden ${
        selected ? 'ring-2 ring-[rgb(var(--accent))]' : ''
      }`}
      onPointerDown={onPointerDown}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onStartEdit()
      }}
    >
      {isEditing ? (
        <textarea
          value={item.text}
          autoFocus
          onChange={(event) => onTextChange(event.target.value)}
          onBlur={onFinishEdit}
          onPointerDown={(event) => event.stopPropagation()}
          onPaste={handleTextareaPaste}
          className="w-full h-full resize-none bg-transparent p-3 pr-8 text-sm outline-none"
          placeholder="Write a note..."
        />
      ) : (
        <div className="w-full h-full p-3 pr-8 text-sm whitespace-pre-wrap break-words text-[rgb(var(--text))] select-none">
          {item.text?.trim() ? item.text : <span className="text-[rgb(var(--text-muted))]">Write a note...</span>}
        </div>
      )}
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
