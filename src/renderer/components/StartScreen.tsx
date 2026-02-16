import { useProjectStore } from '@/renderer/store/projectStore'
import { openProject } from '@/renderer/features/persistence/projectFile'

export function StartScreen() {
  const newProject = useProjectStore((s) => s.newProject)
  const setProject = useProjectStore((s) => s.setProject)
  const setProjectFilePath = useProjectStore((s) => s.setProjectFilePath)

  const handleNewProject = () => {
    newProject()
  }

  const handleOpenProject = async () => {
    const result = await openProject()
    if (result) {
      setProject(result.project)
      setProjectFilePath(result.path)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <h1 className="text-2xl font-medium">Game Script Writer</h1>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleNewProject}
          className="px-6 py-3 rounded border border-border bg-[rgb(var(--accent))] text-white font-medium hover:opacity-90"
        >
          New project
        </button>
        <button
          type="button"
          onClick={handleOpenProject}
          className="px-6 py-3 rounded border border-border bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]"
        >
          Open project
        </button>
      </div>
    </div>
  )
}
