import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/renderer/store/projectStore'

export function SceneList() {
  const projectName = useProjectStore((s) => s.project?.name ?? '')
  const updateProject = useProjectStore((s) => s.updateProject)
  const scenes = useProjectStore((s) => s.project?.scenes ?? [])
  const selectedSceneId = useProjectStore((s) => s.selectedSceneId)
  const setSelectedSceneId = useProjectStore((s) => s.setSelectedSceneId)
  const addScene = useProjectStore((s) => s.addScene)

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(projectName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setEditValue(projectName)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing, projectName])

  const saveProjectName = () => {
    const trimmed = editValue.trim()
    if (trimmed !== projectName) {
      updateProject({ name: trimmed || 'Untitled' })
    }
    setEditing(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveProjectName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveProjectName()
              if (e.key === 'Escape') {
                setEditValue(projectName)
                setEditing(false)
                inputRef.current?.blur()
              }
            }}
            className="w-full text-sm font-medium px-1.5 py-0.5 rounded border border-border bg-[rgb(var(--bg))] text-[rgb(var(--text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--accent))]"
            title="Edit project name"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left text-sm font-medium truncate text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] rounded px-1.5 py-0.5 -mx-1.5 -my-0.5"
            title={`${projectName || 'Untitled'} (click to edit)`}
          >
            {projectName || 'Untitled'}
          </button>
        )}
      </div>
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-[rgb(var(--text-muted))]">Scenes</span>
        <button
          type="button"
          onClick={() => addScene()}
          className="text-sm px-2 py-1 rounded border border-border hover:bg-[rgb(var(--border))]"
          title="New scene"
        >
          + New
        </button>
      </div>
      <ul className="scene-list-scrollbar flex-1 overflow-auto p-1">
        {scenes.length === 0 && (
          <li className="text-sm text-[rgb(var(--text-muted))] p-2">No scenes yet.</li>
        )}
        {scenes.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setSelectedSceneId(s.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
                selectedSceneId === s.id
                  ? 'bg-[rgb(var(--accent))] text-white'
                  : 'hover:bg-[rgb(var(--border))]'
              }`}
            >
              {s.title || 'Untitled'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
