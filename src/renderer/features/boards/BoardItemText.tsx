import {
  useEffect,
  useMemo,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type { BoardTextItem } from '@/shared/model'
import { getImageFileFromClipboard } from './imageUtils'

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface BoardItemTextProps {
  item: BoardTextItem
  selected?: boolean
  isEditing?: boolean
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onStartEdit: () => void
  onFinishEdit: () => void
  onResizeStart: (direction: ResizeDirection, event: PointerEvent<HTMLDivElement>) => void
  onTextChange: (text: string, format: 'plain' | 'html') => void
  onFormatChange: (patch: Partial<Pick<BoardTextItem, 'boldAll' | 'textAlign' | 'textFormat'>>) => void
  onPasteImage: (file: File) => Promise<void>
  onDelete: () => void
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function plainTextToHtml(value: string): string {
  return escapeHtml(value).replaceAll('\n', '<br>')
}

function extractTextContent(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim()
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
  onFormatChange,
  onPasteImage,
  onDelete,
}: BoardItemTextProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const wasEditingRef = useRef(false)
  const normalizedAlign = item.textAlign ?? 'left'
  const boldAll = item.boldAll ?? false
  const editableHtml = useMemo(
    () => (item.textFormat === 'html' ? item.text : plainTextToHtml(item.text)),
    [item.text, item.textFormat]
  )
  const hasText = useMemo(
    () => (item.textFormat === 'html' ? extractTextContent(item.text) : item.text.trim()).length > 0,
    [item.text, item.textFormat]
  )
  const resizeHandles = useMemo(
    () =>
      [
        { direction: 'n', className: 'left-2 right-2 -top-1 h-2 cursor-ns-resize' },
        { direction: 's', className: 'left-2 right-2 -bottom-1 h-2 cursor-ns-resize' },
        { direction: 'e', className: '-right-1 top-2 bottom-2 w-2 cursor-ew-resize' },
        { direction: 'w', className: '-left-1 top-2 bottom-2 w-2 cursor-ew-resize' },
        { direction: 'ne', className: '-right-1 -top-1 h-3 w-3 cursor-nesw-resize' },
        { direction: 'nw', className: '-left-1 -top-1 h-3 w-3 cursor-nwse-resize' },
        { direction: 'se', className: '-right-1 -bottom-1 h-3 w-3 cursor-nwse-resize' },
        { direction: 'sw', className: '-left-1 -bottom-1 h-3 w-3 cursor-nesw-resize' },
      ] as const,
    []
  )

  const persistEditorHtml = () => {
    const node = editorRef.current
    if (!node) return
    const rawHtml = node.innerHTML
    const textContent = (node.textContent ?? '').trim()
    onTextChange(textContent ? rawHtml : '', 'html')
  }

  useEffect(() => {
    if (!isEditing || wasEditingRef.current) return
    const node = editorRef.current
    if (!node) return
    node.innerHTML = editableHtml
  }, [editableHtml, isEditing])

  useEffect(() => {
    wasEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    const node = editorRef.current
    if (!node) return
    const raf = requestAnimationFrame(() => {
      node.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [isEditing])

  const handleEditorPaste = async (event: ClipboardEvent<HTMLDivElement>) => {
    const imageFile = getImageFileFromClipboard(event.nativeEvent)
    if (!imageFile) return
    event.preventDefault()
    await onPasteImage(imageFile)
  }

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const isBoldShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b'
    if (!isBoldShortcut) return
    const selection = window.getSelection()
    const editor = editorRef.current
    const hasSelection =
      !!selection &&
      !selection.isCollapsed &&
      !!editor &&
      !!selection.anchorNode &&
      !!selection.focusNode &&
      editor.contains(selection.anchorNode) &&
      editor.contains(selection.focusNode)
    if (!hasSelection) return
    event.preventDefault()
    event.stopPropagation()
    document.execCommand('bold')
    persistEditorHtml()
  }

  return (
    <div
      className={`relative w-full h-full rounded-md bg-[rgb(var(--bg-muted))] shadow-sm ${
        selected ? 'ring-2 ring-[rgb(var(--accent))]' : ''
      }`}
      onPointerDown={onPointerDown}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onStartEdit()
      }}
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
      {selected ? (
        <div
          className="absolute left-full ml-2 top-2 z-30 flex items-center gap-1 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/95 px-1 py-0.5 shadow-md"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          <button
            type="button"
            title="Bold all text"
            className={`h-6 min-w-6 rounded px-1 text-xs font-semibold ${
              boldAll
                ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-muted))]'
            }`}
            onClick={() => onFormatChange({ boldAll: !boldAll })}
          >
            B
          </button>
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              title={`Align ${align}`}
              className={`h-6 min-w-6 rounded px-1 text-[11px] uppercase ${
                normalizedAlign === align
                  ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                  : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-muted))]'
              }`}
              onClick={() => onFormatChange({ textAlign: align })}
            >
              {align.slice(0, 1)}
            </button>
          ))}
        </div>
      ) : null}
      {isEditing ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={persistEditorHtml}
          onBlur={() => {
            persistEditorHtml()
            onFinishEdit()
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onPaste={handleEditorPaste}
          onKeyDown={handleEditorKeyDown}
          className="w-full h-full overflow-auto bg-transparent p-3 pr-8 text-sm outline-none whitespace-pre-wrap break-words"
          style={{ textAlign: normalizedAlign, fontWeight: boldAll ? 700 : 400 }}
        />
      ) : hasText ? (
        item.textFormat === 'html' ? (
          <div
            className="w-full h-full p-3 pr-8 text-sm whitespace-pre-wrap break-words text-[rgb(var(--text))] select-none"
            style={{ textAlign: normalizedAlign, fontWeight: boldAll ? 700 : 400 }}
            dangerouslySetInnerHTML={{ __html: item.text }}
          />
        ) : (
          <div
            className="w-full h-full p-3 pr-8 text-sm whitespace-pre-wrap break-words text-[rgb(var(--text))] select-none"
            style={{ textAlign: normalizedAlign, fontWeight: boldAll ? 700 : 400 }}
          >
            {item.text}
          </div>
        )
      ) : (
        <div
          className="w-full h-full p-3 pr-8 text-sm break-words text-[rgb(var(--text))] select-none"
          style={{ textAlign: normalizedAlign, fontWeight: boldAll ? 700 : 400 }}
        >
          <span className="text-[rgb(var(--text-muted))]">Write a note...</span>
        </div>
      )}
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
