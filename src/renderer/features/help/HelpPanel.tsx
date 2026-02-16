export function HelpPanel() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Help</h2>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Quick reference for controls, commands, and the main workflow.
          </p>
        </header>

        <section className="border border-border rounded-lg p-4 bg-[rgb(var(--bg-muted))]">
          <h3 className="font-medium mb-3">Top Bar Commands</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">Open</span> - Load a `.gscript` project file.
            </li>
            <li>
              <span className="font-medium">Save</span> - Save current project (auto-save path if
              already opened/saved once).
            </li>
            <li>
              <span className="font-medium">Save As</span> - Save current project to a new
              `.gscript` file.
            </li>
            <li>
              <span className="font-medium">Export PDF</span> - Open print dialog with screenplay
              formatting. Choose "Save as PDF".
            </li>
            <li>
              <span className="font-medium">Theme</span> - Switch between `Light`, `Dark`, and
              `System`.
            </li>
          </ul>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">View Tabs</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">Editor</span> - Write screenplay beats for the selected
              scene.
            </li>
            <li>
              <span className="font-medium">Graph</span> - Visual scene flow and connections.
            </li>
            <li>
              <span className="font-medium">Split</span> - Editor and graph side-by-side.
            </li>
            <li>
              <span className="font-medium">Help</span> - This reference page.
            </li>
          </ul>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Scene and Graph Workflow</h3>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Create a scene from the sidebar (`+ New`) or graph (`+ New scene`).</li>
            <li>Select the scene in the sidebar to edit its title and content.</li>
            <li>In the graph, drag from one scene node to another to create a branch.</li>
            <li>
              Double-click a graph node to open that scene in the editor.
            </li>
            <li>Drag scene nodes in graph view to reposition them.</li>
          </ol>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Editor Commands</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">Enter</span> - Insert a new beat under the current
              beat.
            </li>
            <li>
              <span className="font-medium">Choice Point</span> - Add options and assign target
              scenes from the dropdown.
            </li>
            <li>
              Changes in choice targets are synced to graph edges automatically.
            </li>
          </ul>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Saving and Auto-save</h3>
          <p className="text-sm">
            After opening/saving a file once, edits auto-save in the background (debounced). Use
            `Save As` to branch versions of your project.
          </p>
        </section>
      </div>
    </div>
  )
}
