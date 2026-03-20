import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/renderer/store/projectStore'

export function SceneList() {
  const projectName = useProjectStore((s) => s.project?.name ?? '')
  const updateProject = useProjectStore((s) => s.updateProject)
  const scenes = useProjectStore((s) => s.project?.scenes ?? [])
  const selectedSceneId = useProjectStore((s) => s.selectedSceneId)
  const setSelectedSceneId = useProjectStore((s) => s.setSelectedSceneId)
  const addScene = useProjectStore((s) => s.addScene)
  const addBranchScene = useProjectStore((s) => s.addBranchScene)
  const updateScene = useProjectStore((s) => s.updateScene)
  const isSceneUnattached = useProjectStore((s) => s.isSceneUnattached)

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(projectName)
  const inputRef = useRef<HTMLInputElement>(null)
  const [branchFormOpen, setBranchFormOpen] = useState(false)
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null)
  const [branchTitle, setBranchTitle] = useState('')
  const [precedingCanonSceneId, setPrecedingCanonSceneId] = useState('')
  const [followingCanonSceneId, setFollowingCanonSceneId] = useState('')
  const [conditionText, setConditionText] = useState('')

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

  const canonScenes = scenes.filter((s) => s.sceneKind === 'canon')
  const branchScenes = [...scenes]
    .filter((s) => s.sceneKind === 'branch')
    .sort((a, b) => {
      const ap = a.branchMeta?.precedingCanonSceneId ?? ''
      const bp = b.branchMeta?.precedingCanonSceneId ?? ''
      if (ap !== bp) return ap.localeCompare(bp)
      const ao = a.branchMeta?.branchOrder ?? Number.MAX_SAFE_INTEGER
      const bo = b.branchMeta?.branchOrder ?? Number.MAX_SAFE_INTEGER
      if (ao !== bo) return ao - bo
      return a.id.localeCompare(b.id)
    })

  const resetBranchForm = () => {
    setBranchFormOpen(false)
    setEditingBranchId(null)
    setBranchTitle('')
    setPrecedingCanonSceneId('')
    setFollowingCanonSceneId('')
    setConditionText('')
  }

  const beginCreateBranch = () => {
    setEditingBranchId(null)
    setBranchTitle('')
    setPrecedingCanonSceneId(canonScenes[0]?.id ?? '')
    setFollowingCanonSceneId(canonScenes[1]?.id ?? canonScenes[0]?.id ?? '')
    setConditionText('')
    setBranchFormOpen(true)
  }

  const beginEditBranch = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId)
    if (!scene || scene.sceneKind !== 'branch') return
    setEditingBranchId(scene.id)
    setBranchTitle(scene.title || '')
    setPrecedingCanonSceneId(scene.branchMeta?.precedingCanonSceneId ?? '')
    setFollowingCanonSceneId(scene.branchMeta?.followingCanonSceneId ?? '')
    setConditionText(scene.branchMeta?.conditionText ?? '')
    setBranchFormOpen(true)
  }

  const saveBranch = () => {
    if (!precedingCanonSceneId || !followingCanonSceneId) {
      window.alert('Please select both preceding and following canon scenes.')
      return
    }
    if (editingBranchId) {
      const existing = scenes.find((s) => s.id === editingBranchId)
      if (!existing || existing.sceneKind !== 'branch' || !existing.branchMeta) return
      updateScene(editingBranchId, {
        title: branchTitle.trim() || 'Untitled Branch Scene',
        branchMeta: {
          ...existing.branchMeta,
          precedingCanonSceneId,
          followingCanonSceneId,
          conditionText: conditionText.trim(),
        },
      })
      resetBranchForm()
      return
    }
    addBranchScene({
      title: branchTitle.trim() || 'Untitled Branch Scene',
      precedingCanonSceneId,
      followingCanonSceneId,
      conditionText: conditionText.trim(),
    })
    resetBranchForm()
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="p-2 border-b border-border shrink-0">
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
            className="w-full text-sm font-medium px-1.5 py-0.5 rounded border border-border bg-[rgb(var(--bg))] text-[rgb(var(--text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ring))]"
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
      <div className="p-2 border-b border-border space-y-2 shrink-0">
        <span className="text-sm font-medium text-[rgb(var(--text-muted))]">Scenes</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => addScene()}
            className="text-xs px-2 py-1 rounded border border-border hover:bg-[rgb(var(--border))]"
            title="New canon scene"
          >
            + Canon
          </button>
          <button
            type="button"
            onClick={beginCreateBranch}
            className="text-xs px-2 py-1 rounded border border-border hover:bg-[rgb(var(--border))]"
            title="Create branched scene"
            disabled={canonScenes.length < 2}
          >
            + Branch
          </button>
        </div>
        {canonScenes.length < 2 && (
          <p className="text-[10px] text-[rgb(var(--text-muted))]">
            Add at least 2 canon scenes to create a branch.
          </p>
        )}
      </div>
      {branchFormOpen && (
        <div className="p-2 border-b border-border space-y-1.5 text-xs bg-[rgb(var(--bg))]">
          <div className="font-medium">
            {editingBranchId ? 'Edit branched scene' : 'Create branched scene'}
          </div>
          <input
            type="text"
            value={branchTitle}
            onChange={(e) => setBranchTitle(e.target.value)}
            placeholder="Branch title"
            className="w-full px-2 py-1 rounded border border-border bg-[rgb(var(--bg-muted))]"
          />
          <select
            value={precedingCanonSceneId}
            onChange={(e) => setPrecedingCanonSceneId(e.target.value)}
            className="w-full px-2 py-1 rounded border border-border bg-[rgb(var(--bg-muted))]"
          >
            <option value="">Preceding canon scene</option>
            {canonScenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayNumber ?? '?'} {s.title || 'Untitled'}
              </option>
            ))}
          </select>
          <select
            value={followingCanonSceneId}
            onChange={(e) => setFollowingCanonSceneId(e.target.value)}
            className="w-full px-2 py-1 rounded border border-border bg-[rgb(var(--bg-muted))]"
          >
            <option value="">Following canon scene</option>
            {canonScenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayNumber ?? '?'} {s.title || 'Untitled'}
              </option>
            ))}
          </select>
          <textarea
            value={conditionText}
            onChange={(e) => setConditionText(e.target.value)}
            placeholder="Condition to activate this scene"
            className="w-full px-2 py-1 rounded border border-border bg-[rgb(var(--bg-muted))] min-h-16 resize-y"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={saveBranch}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-[rgb(var(--border))]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={resetBranchForm}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-[rgb(var(--border))]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <ul className="scene-list-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1 space-y-2">
        {scenes.length === 0 && (
          <li className="text-sm text-[rgb(var(--text-muted))] p-2">No scenes yet.</li>
        )}
        <li>
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-[rgb(var(--text-muted))]">
            Canon Scenes
          </div>
          {canonScenes.length === 0 ? (
            <div className="text-xs text-[rgb(var(--text-muted))] px-2 py-1">No canon scenes.</div>
          ) : (
            canonScenes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSceneId(s.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
                  selectedSceneId === s.id
                    ? 'bg-[rgb(var(--bg))] text-[rgb(var(--text))] border border-border'
                    : 'hover:bg-[rgb(var(--border))]'
                }`}
                title={s.title || 'Untitled'}
              >
                {s.displayNumber ? (
                  <>
                    <span className="text-[rgb(var(--text-muted))] shrink-0">{s.displayNumber}</span>
                    <span className="ml-1.5">{s.title || 'Untitled'}</span>
                  </>
                ) : (
                  s.title || 'Untitled'
                )}
              </button>
            ))
          )}
        </li>
        <li>
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-[rgb(var(--text-muted))]">
            Branched Scenes
          </div>
          {branchScenes.length === 0 ? (
            <div className="text-xs text-[rgb(var(--text-muted))] px-2 py-1">No branched scenes.</div>
          ) : (
            branchScenes.map((s) => {
              const unattached = isSceneUnattached(s.id)
              return (
                <div key={s.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSceneId(s.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm ${
                      selectedSceneId === s.id
                        ? 'bg-[rgb(var(--bg))] text-[rgb(var(--text))] border border-border'
                        : 'hover:bg-[rgb(var(--border))]'
                    }`}
                    title={s.title || 'Untitled'}
                  >
                    <div className="truncate">
                      {s.displayNumber ? (
                        <>
                          <span className="text-[rgb(var(--text-muted))]">{s.displayNumber}</span>
                          <span className="ml-1.5">{s.title || 'Untitled'}</span>
                        </>
                      ) : (
                        s.title || 'Untitled'
                      )}
                    </div>
                    <div className="text-[10px] text-[rgb(var(--text-muted))] truncate mt-0.5">
                      {unattached
                        ? 'Unattached to canon flow'
                        : `Condition: ${s.branchMeta?.conditionText || '(none)'}`}
                    </div>
                  </button>
                  <div className="px-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => beginEditBranch(s.id)}
                      className="text-[10px] underline text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                    >
                      Edit branch links/condition
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </li>
      </ul>
    </div>
  )
}
